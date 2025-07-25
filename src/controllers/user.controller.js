import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "..utils/cloudinary.js";
import { ApiResponse } from "..utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
   // get the input from frontend
   // validate the input - not empty
   // check if user already exist 
   // check for images, check for avatar
   // upload them to cloudinary, avatar
   // create user object - create entry in db
   // remove password and refresh token feild from response
   // check for user creation
   // return response 

    //get input from frontend
    const {fullName,email,username,password}= req.body
    console.log("email:", email);

    //validation
   if (
    [fullName,email,username,password].some((field) => 
    field?.trim() === "")
   ) {
    throw new ApiError(400, "All fields are required")
   }

   //check if user already exists
   const existedUser = User.findOne({
    $or: [{ username },{ email }]
   })

   if(existedUser) {
    throw new ApiError(409, "User already exists with this email or username")
   }

   //check for images 

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;
   path;

   if (!avatarLocalPath) {
    throw new ApiError (400, "Avatar file is required")
   }

   // upload on cloudinary

   const avatar  = await uploadCloudinary(avatarLocalPath)
   const coverImage = await uploadCloudinary
    (coverImageLocalPath)

  // check if avatar is there or no 
    if(!avatar) {
      throw new ApiError(400, "Avatar file is required")
    }

  // create user object and insert in db 
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while regestring the user")
  }

  //return response

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully" )
  )

})

export { registerUser };