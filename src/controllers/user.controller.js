import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(userId)    //finds the user 
    const accessToken = user.generateAccessToken()   // generates accesstoken
    const refreshToken = user.generateRefreshToken()  //generates refresh token

    user.refreshToken = refreshToken   //save the refresh token in db
    await user.save({validateBeforeSave: false})

    return { accessToken, refreshToken}  //returns the access and refresh tokens


  } catch (error) {
    throw new ApiError(500, "Error generatind refresh and access tokens")
  }
}

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
    
    //validation
   if (
    [fullName,email,username,password].some((field) => 
    field?.trim() === "")
   ) {
    throw new ApiError(400, "All fields are required")
   }

   //check if user already exists
   const existedUser = await User.findOne({
    $or: [{ username },{ email }]
   })

   if(existedUser) {
    throw new ApiError(409, "User already exists with this email or username")
   }

   //check for images 

   //console.log(req.files);

   const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.
      coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImages[0].path
      }
   
    

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


const loginUser = asyncHandler(async (req,res) => {

  // req body -> data
  // username or email
  // find the user 
  // password check 
  // access and refresh token 
  // send cookie


  // get the data using req.body
  const { email, username, password } = req.body
  console.log(email);

  
    if (!username && !email) {
    throw new ApiError (400, "Username or  password is required ")
  }

  // Find the user

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError (404," user does not exist ")
  }

  // password check 

  const isPasswordValid = await user.isPasswordCorrect(password)


  if (!isPasswordValid) {
    throw new ApiError (401," Invalid User Credentials ")  
  } 

  const { refreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  // send the cookie 

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken,
        refreshToken
      },
      "User logged In Successfully"
    )
      
  )

   
})

const logoutUser  = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))

})


const refreshAccessToken = asyncHandler (async( req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken) {
    throw new ApiError(401," unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    
    if(!user) {
      throw new ApiError(401," Invalid Refresh Token")
    }
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used ")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken,options)
    .json(
      new ApiResponse (200,
        { accessToken, refreshToken: newrefreshToken},
        "Access token refreshed"
      )
    )
  
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
  }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  const {oldPassword, newPassword} = req.body

  const user = await  User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!PasswordCorrect) {
    throw new ApiError(400, "Invalid old Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully "))
})

const getCurrentUser = asynchandler(async(req, res) => {
  return res
  .status(200)
  .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asynchandler(async(req, res) => {
  const {fullName, email} = req.Body
  if(!fullName || !email) {
    throw new ApiError(400," All fields are required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    {new: true}
  
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
})


const updateUserAvatar = asyncHandler(asnc(req,res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set:{
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, " Avatar image updated successfully")
  )
})



const updateUserCoverImage = asyncHandler(asnc(req,res) => {
  const coverLocalPath = req.file?.path

  if(!coverImageLocalPath) {
    throw new ApiError(400,"Cover image is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400,"Error while uploading the cover image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, " Cover image updated successfully")
  )
})
 
export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateCurrentDetails,
  updateUserAvatar,
  updateUserCoverImage

};     


//Access tokens are short lived gets expired in short time
//Refresh tokes are long lived gets expired in long time   





 















   