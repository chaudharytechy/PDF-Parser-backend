import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim:true
    },
    password:{
        type: String,
        required: true, 
        minlength:5,
        trim:true
    }

},{
    timestamps:true
})

const userModel=mongoose.model("userTable",userSchema);
export default userModel