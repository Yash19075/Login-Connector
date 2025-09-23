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

    let avatarLocalPath = req.file?.path; // multer gives this
    let avatar = null;

    // Only upload to Cloudinary if file exists
    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    }

    const user = await User.create({
        username,
        email,
        fullName,
        password,
        avatar: avatar?.url || "", // store only URL
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
    console.log("=== LOGIN CONTROLLER START ===");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    const {email, password} = req.body

    // Validate input
    if (!email) {
        console.log("ERROR: No email provided");
        throw new ApiError(400, "Email is required")
    }

    if (!password) {
        console.log("ERROR: No password provided");
        throw new ApiError(400, "Password is required")
    }

    console.log("Looking for user with email:", email);

    try {
        // Find user by email only
        const user = await User.findOne({email})

        console.log("User found:", user ? "YES" : "NO");

        if (!user) {
            throw new ApiError(404, "User doesn't exist")
        }

        console.log("Checking password...");
        
        // Check password
        const isPasswordValid = await user.isPasswordCorrect(password)
        console.log("Password valid:", isPasswordValid);
        
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid password")
        }

        console.log("Generating tokens...");
        
        // Generate tokens
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
        
        console.log("Tokens generated successfully");
        
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        }

        console.log("Sending response...");

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
        console.error("=== LOGIN ERROR ===", error);
        throw error; // Re-throw to let asyncHandler handle it
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

  // Extract user's reviews with item information
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

  // Sort by most recent reviews first
  userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res
    .status(200)
    .json(new ApiResponse(200, userReviews, "User reviews fetched successfully"));
});

const viewOtherProfile = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.params;

    if(!userId) 
    {
        throw new ApiError(400, "User not found")
    }
    
    const otherUser = await User.findById(otherUserId)
    if(!otherUser)
    {
        throw new ApiError(404, "User doesn't exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, otherUser, "User fetched successfully"));
})

const rateUser = asyncHandler(async (req,res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.params;

    if(!userId) 
    {
        throw new ApiError(400, "User not found")
    }

    const otherUser = await User.findById(otherUserId)
    if(!otherUser)
    {
        throw new ApiError(404, "User doesn't exist")
    }

    const { rating } = req.body;
    if(!rating || rating < 1 || rating > 5){
        throw  new ApiError(401, "No rating provided")
    }

    if(otherUser.role === 'buyer')
    {
        throw new ApiError("You cannot rate a buyer")
    }

    const existingRating = otherUser.ratings.find(
        rate => rate.ratedBy.toString() === userId.toString()
    )

    if(existingRating)
    {
        throw new ApiError("You already rated the user once")
    }

    const newRating= {
        rating: Number(rating),
        ratedBy: userId
    }

    otherUser.ratings.push(newRating);
    await otherUser.save();

    await otherUser.populate("ratings.ratedBy" , "username fullName")

    return res
    .status(200)
    .json(new ApiResponse(200, newRating, "User rated successfully"))
    
})

export {registerUser, loginUser, getUser, logoutUser, getUserReviews, viewOtherProfile, rateUser}