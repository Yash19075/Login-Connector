import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import { Item } from "../models/items.models.js";
import { Order } from "../models/order.model.js";

const getMyBoughtOrders = asyncHandler(async(req, res) => {
    const userId = req.user?._id;

    if(!userId)
    {
        throw new ApiError(400, "User does not exist")
    }

    const orders = await Order.find({ buyer: userId })
  .populate("item", "name picture price postedBy")
  .populate("seller", "username fullName")
  .sort({ createdAt: -1 });

  return res
  .status(200)
  .json(new ApiResponse(200, orders, "Orders fetched successfully"))
})

const getMySoldOrders = asyncHandler(async(req, res) => {
    const userId = req.user?._id; // Fixed: was req.user?.id

    if(!userId) {
        throw new ApiError(400, "User not found")
    }

    const orders = await Order.find({seller : userId})
        .populate("item", "name picture price postedBy")
        .populate("buyer", "username fullName avatar") // Fixed: was "seller", added avatar
        .sort({createdAt : -1})

      
    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully"))
})

export {getMyBoughtOrders, getMySoldOrders}

