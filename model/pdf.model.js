import mongoose from "mongoose";


const pdfSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    pdfUrl: {
        url: {
            type: String,
            required: true,
            trim: true
        },
        publicId: {
            type: String,
            required: true,
            trim: true
        }
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "userTable",
        required: true
    },
 
    type:{
        type: String,
        required: true,
    }

})

const pdfModel=mongoose.model("pdfTable",pdfSchema)
export default pdfModel