import path from "path";
import pdfModel from "../model/pdf.model.js";
import { generateUploadURL } from "../utils/generateUrl.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embed } from "../gemini.js";
import { parseAndEmbed } from "../parser.js";
import { createRAGChain } from "../rag.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import { S3Client} from "@aws-sdk/client-s3";
import multer from "multer";

export const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
// async function generateUploadURL(key) {
//   const command = new GetObjectCommand({
//     Bucket: "ngo-guru-bucket",
//     Key: key
//   });

//   const url = await getSignedUrl(s3, command, { expiresIn: 9000 }); // 15 min
//   return url;
// }





export const uploadDcoument = async (req, res) => {
  try {
    const file = req.file;

    const userId = req.user._id;

    console.log("User:", req.user);
    console.log("User ID:", userId);

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const ext = path.extname(file.originalname).toLowerCase();

    let type;

    if (ext === ".pdf") {
      type = "pdf";
    } else if (ext === ".docx") {
      type = "docx";
    } else if (ext === ".txt") {
      type = "text";
    } else {
      return res.status(400).json({
        message: "Unsupported file type",
      });
    }

    const key = `pdf/${type}/${Date.now()}-${file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: "ngo-guru-bucket",
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const url = await generateUploadURL(key, file.mimetype);

    const data = await pdfModel.create({
      name: file.originalname,
      pdfUrl: {
        url,
        publicId: key,
      },
      type,
      userId, // <-- IMPORTANT
    });

    const embeddings = await parseAndEmbed(
      file.buffer,
      type,
      userId,
      data._id
    );

    return res.status(201).json({
      message: "Document processed successfully",
      document: data,
      preview: embeddings.preview,
    });

  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      message: "Document upload failed",
      error: error.message,
    });
  }
};
export const getDocument = async (req, res) => {
  try {
    const { id } = req.user;

    const data = await pdfModel.find({ userId: id });

    await Promise.all(
      data.map(async (document) => {
        document.pdfUrl.url = await generateUploadURL(document.pdfUrl.publicId);
        return document;
      })
    );

    return res.status(200).json({
      message: "Document fetched successfully",
      document: data,
    });
  } catch (error) {
    console.error("Fetch document error:", error);

    return res.status(500).json({
      message: "Document fetch failed",
      error: error.message,
    });
  }
};

export const getSingleDocument = async (req, res) => {
  try {
    const { id } = req.user;
    const { docId } = req.params;
  //  console.log("docId:", docId);
  //   console.log("docId type:", typeof docId);

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }
    const document = await pdfModel.findOne({
      userId: id,
      _id: docId,
    }).lean();

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.pdfUrl?.url) {
      document.pdfUrl.url = await generateUploadURL(document.pdfUrl.publicId);
    }

    return res.status(200).json({
      message: "Document fetched successfully",
      document,
    });
  } catch (error) {
    console.error("Get single document error:", error);

    return res.status(500).json({
      message: "Failed to fetch document",
      error: error.message,
    });
  }
};

const ragPromise = createRAGChain()
// export const askQuestion = async (req, res) => {
//   try {
//     const ragChain = await ragPromise;
//     const { question } = req.body;

//     const response = await ragChain.invoke({
//       question,
//     });

//     res.json({ answer: response });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// }
export const askQuestion = async (req, res) => {
  try {
    const { question} = req.body;
    const {docId}=req.params
    const userId = req.user.id;
// console.log(question, docId,userId)
    // Verify that this document belongs to this user
    const document = await pdfModel.findOne({
      _id: docId,
      userId: userId,
    });

    if (!document) {
      return res.status(404).json({
        error: "Document not found or you don't have access to it",
      });
    }

    const ragChain = await ragPromise;

    const response = await ragChain.invoke({
      question,
      userId: userId.toString(),
      docId: docId.toString(),
    });

    res.json({
      answer: response,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
};
