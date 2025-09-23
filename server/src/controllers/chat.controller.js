import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Chat } from "../models/chat.models.js";
import { Item } from "../models/items.models.js";
import { User } from "../models/user.models.js";

// Send a private message using your existing Chat model
const sendPrivateMessage = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId } = req.params;
  const { message } = req.body;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!message || message.trim() === '') {
    throw new ApiError(400, "Message cannot be empty");
  }

  // Find the item to get seller information
  const item = await Item.findById(itemId).populate("postedBy");
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const sellerId = item.postedBy._id;
  
  // Prevent users from messaging themselves
  if (userId.toString() === sellerId.toString()) {
    throw new ApiError(400, "You cannot send a private message to yourself");
  }

  // Create new private chat message using your existing Chat model
  const newMessage = await Chat.create({
    item: itemId,
    sentBy: userId,
    message: message.trim(),
  });

  // Populate the message with sender and item details
  await newMessage.populate("sentBy", "username fullName avatar");
  await newMessage.populate("item", "name picture price postedBy");

  return res
    .status(201)
    .json(new ApiResponse(201, newMessage, "Private message sent successfully"));
});

// Get private messages between two users for a specific item
const getPrivateMessages = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId, otherUserId } = req.params;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  // Find the item to verify it exists
  const item = await Item.findById(itemId).populate("postedBy");
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  // Verify that the current user is either the seller or involved in the conversation
  const sellerId = item.postedBy._id.toString();
  const currentUserId = userId.toString();
  
  if (currentUserId !== sellerId && currentUserId !== otherUserId) {
    throw new ApiError(403, "You are not authorized to view this conversation");
  }

  // Get private messages between the two users for this specific item
  const messages = await Chat.find({
    item: itemId,
    $or: [
      { sentBy: userId },
      { sentBy: otherUserId }
    ]
  })
    .populate("sentBy", "username fullName avatar")
    .populate("item", "name picture price")
    .sort({ createdAt: 1 });

  // Get other user details
  const otherUser = await User.findById(otherUserId).select("username fullName avatar role");

  return res
    .status(200)
    .json(new ApiResponse(200, {
      messages: messages,
      otherUser,
      item: item
    }, "Private messages fetched successfully"));
});

// Get all users that have chatted with the seller for a specific item (FIXED VERSION)
const getChatParticipants = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId } = req.params;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  // Verify the item exists and get seller info
  const item = await Item.findById(itemId).populate("postedBy");
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const sellerId = item.postedBy._id.toString();
  const currentUserId = userId.toString();

  // Only the seller can view chat participants for their item
  if (currentUserId !== sellerId) {
    throw new ApiError(403, "Only the item owner can view chat participants");
  }

  // Get all messages for this item
  const messages = await Chat.find({ item: itemId })
    .populate("sentBy", "username fullName avatar role")
    .sort({ createdAt: -1 });

  // Create a map to track unique chat participants and their last message
  const participantsMap = new Map();
  
  messages.forEach(msg => {
    const senderId = msg.sentBy._id.toString();
    
    // Only include messages from buyers (not from the seller themselves)
    if (senderId !== sellerId) {
      // If we haven't seen this participant yet, add them
      if (!participantsMap.has(senderId)) {
        participantsMap.set(senderId, {
          user: msg.sentBy,
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          unreadCount: 0 // You can implement read tracking if needed
        });
      }
    }
  });

  const participants = Array.from(participantsMap.values());

  return res
    .status(200)
    .json(new ApiResponse(200, participants, "Chat participants fetched successfully"));
});

// Get all private chat conversations for current user across all items
const getAllPrivateChats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  // Get all messages where user is either sender or the conversation involves them
  const messages = await Chat.find({
    $or: [
      { sentBy: userId }, // Messages sent by current user
    ]
  })
    .populate("sentBy", "username fullName avatar")
    .populate("item", "name picture price postedBy")
    .sort({ createdAt: -1 });

  // Also get messages sent TO the current user (where they are the seller)
  const itemsWhereUserIsSeller = await Item.find({ postedBy: userId }).select('_id');
  const sellerItemIds = itemsWhereUserIsSeller.map(item => item._id);

  const messagesToSeller = await Chat.find({
    item: { $in: sellerItemIds },
    sentBy: { $ne: userId } // Messages NOT sent by current user
  })
    .populate("sentBy", "username fullName avatar")
    .populate("item", "name picture price postedBy")
    .sort({ createdAt: -1 });

  // Combine all messages
  const allMessages = [...messages, ...messagesToSeller];

  // Group messages by item and other user
  const chatsMap = new Map();
  
  for (const msg of allMessages) {
    const itemId = msg.item._id.toString();
    const senderId = msg.sentBy._id.toString();
    
    // For each item, we need to find who the "other" user is
    let otherUserId;
    if (senderId === userId.toString()) {
      // Current user sent this message, so other user is the item owner
      otherUserId = msg.item.postedBy.toString();
    } else {
      // Someone else sent this message, so they are the other user
      otherUserId = senderId;
    }
    
    // Skip if other user is the same as current user
    if (otherUserId === userId.toString()) continue;
    
    const chatKey = `${itemId}-${otherUserId}`;
    
    if (!chatsMap.has(chatKey)) {
      // Get the other user details
      const otherUser = senderId === userId.toString() ? 
        await User.findById(msg.item.postedBy).select("username fullName avatar role") :
        msg.sentBy;
      
      chatsMap.set(chatKey, {
        item: msg.item,
        otherUser: otherUser,
        lastMessage: msg.message,
        lastMessageAt: msg.createdAt,
        unreadCount: 0 // Implement read tracking if needed
      });
    }
  }

  const chats = Array.from(chatsMap.values())
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Private chats fetched successfully"));
});

// Delete private messages between two users for a specific item
const deletePrivateChat = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId, otherUserId } = req.params;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  // Verify the item exists and check permissions
  const item = await Item.findById(itemId);
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const sellerId = item.postedBy.toString();
  const currentUserId = userId.toString();

  // Only allow deletion if user is either the seller or the other participant
  if (currentUserId !== sellerId && currentUserId !== otherUserId) {
    throw new ApiError(403, "You can only delete conversations you are part of");
  }

  // Delete all messages between these two users for this item
  const result = await Chat.deleteMany({
    item: itemId,
    $or: [
      { sentBy: userId },
      { sentBy: otherUserId }
    ]
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedCount: result.deletedCount }, "Private chat deleted successfully"));
});

export {
  sendPrivateMessage,
  getPrivateMessages,
  getChatParticipants,
  getAllPrivateChats,
  deletePrivateChat
};