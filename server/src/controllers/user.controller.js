import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import { Item } from "../models/items.models.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;

    if (!fullName || !username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    let avatarLocalPath = req.file?.path;
    let avatar = null;

    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    }

    const user = await User.create({
        username,
        email,
        fullName,
        password,
        avatar: avatar?.url || "",
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User wasn't registered");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    if (!password) {
        throw new ApiError(400, "Password is required")
    }

    try {
        const user = await User.findOne({email})

        if (!user) {
            throw new ApiError(404, "User doesn't exist")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid password")
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
        
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {
                        user: loggedInUser, 
                        accessToken, 
                        refreshToken
                    },
                    "User logged in successfully"
                )
            )
    } catch (error) {
        throw error;
    }
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .status(200)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const getUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "No user with this ID exist");
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User doesn't exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
});

const getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User ID not found in request");
  }

  const items = await Item.find({
    "reviews.reviewBy": userId
  })
  .populate("postedBy", "username fullName")
  .select("name picture price reviews");

  if (!items || items.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No reviews found"));
  }

  const userReviews = [];
  
  items.forEach(item => {
    const userReview = item.reviews.find(
      review => review.reviewBy.toString() === userId.toString()
    );
    
    if (userReview) {
      userReviews.push({
        _id: userReview._id,
        rating: userReview.rating,
        comment: userReview.comment,
        createdAt: userReview.createdAt,
        updatedAt: userReview.updatedAt,
        item: {
          _id: item._id,
          name: item.name,
          picture: item.picture,
          price: item.price,
          postedBy: item.postedBy
        }
      });
    }
  });

  userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res
    .status(200)
    .json(new ApiResponse(200, userReviews, "User reviews written fetched successfully"));
});

const getReceivedReviews = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User ID not found in request");
  }

  const items = await Item.find({
    postedBy: userId,
    "reviews.0": { $exists: true }
  })
  .populate("reviews.reviewBy", "username fullName avatar")
  .select("name picture price reviews");

  if (!items || items.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No reviews received"));
  }

  const receivedReviews = [];
  
  items.forEach(item => {
    item.reviews.forEach(review => {
      receivedReviews.push({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        reviewBy: review.reviewBy,
        item: {
          _id: item._id,
          name: item.name,
          picture: item.picture,
          price: item.price
        }
      });
    });
  });

  receivedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res
    .status(200)
    .json(new ApiResponse(200, receivedReviews, "Received reviews fetched successfully"));
});

const viewOtherProfile = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Authentication required")
    }
    
    if (userId.toString() === otherUserId) {
        throw new ApiError(400, "Use /me endpoint to view your own profile")
    }

    const otherUser = await User.findById(otherUserId)
        .select("-password -refreshToken -email")
        .populate("ratings.ratedBy", "username fullName");

    if (!otherUser) {
        throw new ApiError(404, "User doesn't exist")
    }

    let averageRating = 0;
    if (otherUser.ratings && otherUser.ratings.length > 0) {
        const totalRating = otherUser.ratings.reduce((sum, rating) => sum + rating.rating, 0);
        averageRating = (totalRating / otherUser.ratings.length).toFixed(1);
    }

    const postedItems = await Item.find({ postedBy: otherUserId })
        .select("name picture price category createdAt")
        .sort({ createdAt: -1 })
        .limit(10);

    const profileData = {
        ...otherUser.toObject(),
        averageRating: parseFloat(averageRating),
        totalRatings: otherUser.ratings?.length || 0,
        postedItems
    };

    return res
        .status(200)
        .json(new ApiResponse(200, profileData, "User profile fetched successfully"));
})

const rateUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Authentication required")
    }

    if (userId.toString() === otherUserId) {
        throw new ApiError(400, "You cannot rate yourself")
    }

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
        throw new ApiError(404, "User doesn't exist")
    }

    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new ApiError(400, "Rating must be an integer between 1 and 5")
    }

    if (otherUser.role === 'buyer') {
        throw new ApiError(400, "You can only rate sellers")
    }

    const existingRatingIndex = otherUser.ratings.findIndex(
        rate => rate.ratedBy.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
        otherUser.ratings[existingRatingIndex].rating = Number(rating);
        await otherUser.save();
        
        const updatedUser = await User.findById(otherUserId)
            .populate("ratings.ratedBy", "username fullName");
        
        return res
            .status(200)
            .json(new ApiResponse(200, updatedUser.ratings[existingRatingIndex], "Rating updated successfully"))
    } else {
        const newRating = {
            rating: Number(rating),
            ratedBy: userId
        };

        otherUser.ratings.push(newRating);
        await otherUser.save();

        await otherUser.populate("ratings.ratedBy", "username fullName");

        return res
            .status(200)
            .json(new ApiResponse(200, newRating, "User rated successfully"))
    }
})

export {registerUser, loginUser, getUser, logoutUser, getUserReviews, getReceivedReviews, viewOtherProfile, rateUser}