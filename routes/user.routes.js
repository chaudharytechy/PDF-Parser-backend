import express from"express"
import { loginUser, registerUser } from "../controller/user.controller.js"
import auth from "../utils/auth.js"
const userRoute=express.Router()



userRoute.post("/register",registerUser)

userRoute.post("/login",loginUser)

userRoute.get("/verify",auth,(req,res)=>{
   const data=req.user;
   return  res.status(200).json({
    message:"User verified successfully",
   })
})

export default userRoute 