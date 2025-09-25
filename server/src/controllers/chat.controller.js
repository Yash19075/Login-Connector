import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Chat } from "../models/chat.models.js";
import { Item } from "../models/items.models.js";
import { User } from "../models/user.models.js";

const sendPrivateMessage = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId, otherUserId } = req.params;
  const { message } = req.body;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!message || message.trim() === '') {
    throw new ApiError(400, "Message cannot be empty");
  }

  if (!otherUserId) {
    throw new ApiError(400, "Recipient user ID is required");
  }

  const item = await Item.findById(itemId).populate("postedBy");
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new ApiError(404, "Recipient user not found");
  }

  const sellerId = item.postedBy._id.toString();
  const currentUserId = userId.toString();
  
  if (currentUserId === otherUserId) {
    throw new ApiError(400, "You cannot send a message to yourself");
  }

  if (currentUserId !== sellerId && otherUserId !== sellerId) {
    throw new ApiError(400, "Private messages can only be sent between the item seller and potential buyers");
  }

  const newMessage = await Chat.create({
    item: itemId,
    sentBy: userId,
    message: message.trim(),
  });

  await newMessage.populate("sentBy", "username fullName avatar");
  await newMessage.populate("item", "name picture price postedBy");

  return res
    .status(201)
    .json(new ApiResponse(201, newMessage, "Private message sent successfully"));
});

const getPrivateMessages = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId, otherUserId } = req.params;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const item = await Item.findById(itemId).populate("postedBy");
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const sellerId = item.postedBy._id.toString();
  const currentUserId = userId.toString();
  
  const isUserSeller = currentUserId === sellerId;
  const isOtherUserSeller = otherUserId === sellerId;
  const isValidConversation = isUserSeller || isOtherUserSeller;

  if (!isValidConversation) {
    throw new ApiError(403, "You can only view conversations related to this item if you're the seller or chatting with the seller");
  }

  const messages = await Chat.find({
    item: itemId,
    sentBy: { $in: [userId, otherUserId] }
  })
    .populate("sentBy", "username fullName avatar")
    .populate("item", "name picture price")
    .sort({ createdAt: 1 });

  const otherUser = await User.findById(otherUserId).select("username fullName avatar role");

  return res
    .status(200)
    .json(new ApiResponse(200, {
      messages: messages,
      otherUser,
      item: item
    }, "Private messages fetched successfully"));
});

const getChatParticipants = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId } = req.params;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const item = await Item.findById(itemId).populate("postedBy");
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const sellerId = item.postedBy._id.toString();
  const currentUserId = userId.toString();

  if (currentUserId !== sellerId) {
    throw new ApiError(403, "Only the item owner can view chat participants");
  }

  const messages = await Chat.find({ item: itemId })
    .populate("sentBy", "username fullName avatar role")
    .sort({ createdAt: -1 });

  const participantsMap = new Map();
  
  messages.forEach(msg => {
    const senderId = msg.sentBy._id.toString();

    if (senderId !== sellerId) {
      if (!participantsMap.has(senderId)) {
        participantsMap.set(senderId, {
          user: msg.sentBy,
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          unreadCount: 0 
        });
      }
    }
  });

  const participants = Array.from(participantsMap.values());

  return res
    .status(200)
    .json(new ApiResponse(200, participants, "Chat participants fetched successfully"));
});

const getAllPrivateChats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const messages = await Chat.find({
    sentBy: userId
  })
    .populate("sentBy", "username fullName avatar")
    .populate("item", "name picture price postedBy")
    .sort({ createdAt: -1 });

  const itemsWhereUserIsSeller = await Item.find({ postedBy: userId }).select('_id');
  const sellerItemIds = itemsWhereUserIsSeller.map(item => item._id);

  const messagesToSeller = await Chat.find({
    item: { $in: sellerItemIds },
    sentBy: { $ne: userId }
  })
    .populate("sentBy", "username fullName avatar")
    .populate("item", "name picture price postedBy")
    .sort({ createdAt: -1 });

  const allMessages = [...messages, ...messagesToSeller];

  const chatsMap = new Map();
  
  for (const msg of allMessages) {
    const itemId = msg.item._id.toString();
    const senderId = msg.sentBy._id.toString();
    
    let otherUserId;
    if (senderId === userId.toString()) {
      otherUserId = msg.item.postedBy.toString();
    } else {
      otherUserId = senderId;
    }
    
    if (otherUserId === userId.toString()) continue;
    
    const chatKey = `${itemId}-${otherUserId}`;
    
    if (!chatsMap.has(chatKey)) {
      const otherUser = senderId === userId.toString() ? 
        await User.findById(msg.item.postedBy).select("username fullName avatar role") :
        msg.sentBy;
      
      chatsMap.set(chatKey, {
        item: msg.item,
        otherUser: otherUser,
        lastMessage: msg.message,
        lastMessageAt: msg.createdAt,
        unreadCount: 0
      });
    }
  }

  const chats = Array.from(chatsMap.values())
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Private chats fetched successfully"));
});

const deletePrivateChat = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId, otherUserId } = req.params;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const item = await Item.findById(itemId);
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const sellerId = item.postedBy.toString();
  const currentUserId = userId.toString();

  if (currentUserId !== sellerId && currentUserId !== otherUserId) {
    throw new ApiError(403, "You can only delete conversations you are part of");
  }

  const result = await Chat.deleteMany({
    item: itemId,
    sentBy: { $in: [userId, otherUserId] }
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