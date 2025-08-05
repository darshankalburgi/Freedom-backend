import mongoose, {Schema} from 'mongoose';
import jwt from "jsonwebtoken";
<<<<<<< HEAD
import bcrypt from "bcrypt";
=======
import bcrypt from "bcryptjs";
>>>>>>> d3976b3b5b9047cd3e0b8c4de089ec68033ed0e5


const userSchema = new Schema(
  {
    username : {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String, //cloudinary url
      required: true,
      
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    password: {
      type: String,
      required: [true,'Password is required'],
     
    },
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();


<<<<<<< HEAD
  this.password = await bcrypt.hash(this.password, 10)
=======
  this.password = bcrypt.hashSync(this.password, 10)
>>>>>>> d3976b3b5b9047cd3e0b8c4de089ec68033ed0e5
  next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
 )
}
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
 )
}

<<<<<<< HEAD
export const User = mongoose.model("User", userSchema)  


=======
export const User = mongoose.model("User", userSchema)  
>>>>>>> d3976b3b5b9047cd3e0b8c4de089ec68033ed0e5
