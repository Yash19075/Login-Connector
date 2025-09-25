import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {Item} from "../models/items.models.js"
import { User } from "../models/user.models.js";
import { Order } from "../models/order.model.js";

const createItem = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { name, price, quantity, category } = req.body;

  if (!userId) {
    throw new ApiError(401, "User ID not found in request");
  }

  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(400, "User doesn't exist");
  }

  if (user.role === "buyer") {
    throw new ApiError(401, "Only sellers can upload an item");
  }

  const pictureLocalPath = req.file?.path;
  if (!pictureLocalPath) {
    throw new ApiError(400, "Picture is required for the item");
  }

  const picture = await uploadOnCloudinary(pictureLocalPath);
  if (!picture?.url) {
    throw new ApiError(500, "Failed to upload picture to Cloudinary");
  }

  const item = await Item.create({
    name,
    picture: picture.url,
    price,
    category,
    quantity,
    postedBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, item, "Item created successfully"));
});

const getAllItems = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized access. Please log in.");
  }

  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(400, "User doesn't exist");
  }

  const items = await Item.find()
    .populate("postedBy", "username fullName role avatar") 
    .populate("reviews.reviewBy", "username fullName")   
    .populate("chat.sentBy", "username fullName");       
  if (!items || items.length === 0) {
    throw new ApiError(404, "No items found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, items, "Items fetched successfully"));
});

const sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { itemId } = req.params;
    const { message } = req.body;

    if(!message) {
        throw new ApiError(400, "Message is required");
    }
    
    const item = await Item.findById(itemId);
    if (!item) {
        throw new ApiError(404, "Item not found");
    }
     
    const newMessage = {
        message,
        sentBy: userId,
    };

    item.chat.push(newMessage);
    await item.save();

    await item.populate("chat.sentBy", "username fullName");

    return res
        .status(201)
        .json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

const allMessages = asyncHandler(async(req, res) => {
    const userId = req.user?._id;
    const { itemId } = req.params;

    if(!userId) {
        throw new ApiError(400, "User doesn't exist");
    }

    const item = await Item.findById(itemId).populate("chat.sentBy", "username fullName"); 
    if(!item) {
        throw new ApiError(404, "Item doesn't exist"); 
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, item.chat, "Messages fetched successfully"));    
});

const addReview = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId } = req.params; 
  const { rating, comment } = req.body;
  
  if (!userId) {
    throw new ApiError(400, "User doesn't exist");
  }
    
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating is required and must be between 1 and 5");
  }

  const item = await Item.findById(itemId);
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  if (item.postedBy.toString() === userId.toString()) { 
    throw new ApiError(400, "You cannot review your own item");
  }

  const existingReview = item.reviews.find( 
    review => review.reviewBy.toString() === userId.toString() 
  );

  if (existingReview) {
    throw new ApiError(401, "You have already reviewed the item once");
  }

  const newReview = {
    rating: Number(rating),
    comment: comment || "",
    reviewBy: userId
  };

  item.reviews.push(newReview);
  await item.save();

  await item.populate("reviews.reviewBy", "username fullName");

  return res
    .status(201)
    .json(new ApiResponse(201, newReview, "Review added successfully"));
});

const getAllReviews = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId } = req.params;
    
  if (!userId) {
    throw new ApiError(400, "User doesn't exist");
  }

  const item = await Item.findById(itemId)
    .populate("reviews.reviewBy", "username fullName avatar"); 

  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, item.reviews, "Reviews fetched successfully"));
});

const updateReview = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId } = req.params;
  const { rating, comment } = req.body;

  if (!userId) {
    throw new ApiError(401, "User ID not found in request");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating is required and must be between 1 and 5");
  }

  const item = await Item.findById(itemId);
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const reviewIndex = item.reviews.findIndex(
    review => review.reviewBy.toString() === userId.toString()
  );

  if (reviewIndex === -1) {
    throw new ApiError(404, "Review not found");
  }

  // Update the review
  item.reviews[reviewIndex].rating = Number(rating);
  item.reviews[reviewIndex].comment = comment || "";

  await item.save();

  await item.populate("reviews.reviewBy", "username fullName");

  return res
    .status(200)
    .json(new ApiResponse(200, item.reviews[reviewIndex], "Review updated successfully"));
});

const deleteReview = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { itemId } = req.params;

  if (!userId) {
    throw new ApiError(401, "User ID not found in request");
  }

  const item = await Item.findById(itemId);
  if (!item) {
    throw new ApiError(404, "Item not found");
  }

  const reviewIndex = item.reviews.findIndex(
    review => review.reviewBy.toString() === userId.toString()
  );

  if (reviewIndex === -1) {
    throw new ApiError(404, "Review not found");
  }

  item.reviews.splice(reviewIndex, 1);
  await item.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

const updateItem = asyncHandler(async (req,res) => {
  const userId = req.user?._id;
  const { itemId } = req.params;

  if(!userId)
  {
    throw new ApiError(401, "User not found")
  }

  const item = await Item.findById(itemId)
  if(!item)
    {
      throw new ApiError(401, "Item not found")
    } 
  
  if(!(item.postedBy.toString() === userId.toString()))
    {
      throw new ApiError(401, "You cannot edit an item you didn't create")
    }  

  const {name, price, quantity} = req.body;
  
  let pictureUrl = item.picture
  if(req.file?.path)
  {
    const picture = await uploadOnCloudinary(req.file?.path)
    if(picture.url)
      {
        pictureUrl = picture.url;
      }  
  }

  if(name !== undefined) item.name = name  
  if (price !== undefined) item.price = price;
  if (quantity !== undefined) item.quantity = quantity;
  item.picture = pictureUrl;

  const updatedItem = await item.save();
  
  return res
  .status(200)
  .json(new ApiResponse(200, updatedItem, "Item updated successfully"))  
  })
  
const buyItem = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
        throw new ApiError(400, "User Not Found");
    }

    if (!quantity || quantity <= 0) {
        throw new ApiError(400, "Valid quantity is required");
    }

    const item = await Item.findById(itemId);
    if (!item) {
        throw new ApiError(404, "Item not found");
    }

    if (item.postedBy.toString() === userId.toString()) {
        throw new ApiError(401, "You cannot buy your own item");
    }

    if (item.status === "out-of-stock") {
        throw new ApiError(400, "Item is out of stock");
    }

    if (quantity > item.quantity) {
        throw new ApiError(400, "Quantity requested exceeds the available quantity");
    }

    const totalPrice = item.price * quantity;

    item.quantity -= quantity;
    await item.save();

    const orderData = {
        item: itemId,
        buyer: userId,
        seller: item.postedBy,
        quantity: quantity,
        price: item.price,
        totalAmount: totalPrice
    };

    const createdOrder = await Order.create(orderData);

    const populatedOrder = await Order.findById(createdOrder._id)
        .populate('item', 'name picture price')
        .populate('buyer', 'username fullName')
        .populate('seller', 'username fullName');

    return res
        .status(200)
        .json(new ApiResponse(200, populatedOrder, "Order placed successfully"));
});

const getSingleItem = asyncHandler(async(req, res) => {
  const {itemId} = req.params;

  const item = await Item.findById(itemId)
    .populate("postedBy", "username fullName role avatar") 
    .populate("reviews.reviewBy", "username fullName")   
    .populate("chat.sentBy", "username fullName");
  
  if(!item) {
    throw new ApiError(400, "Item not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, item, "Item fetched successfully"))
})


export {createItem, getAllItems, sendMessage, allMessages, addReview, getAllReviews, updateReview, deleteReview, updateItem, getSingleItem, buyItem};
