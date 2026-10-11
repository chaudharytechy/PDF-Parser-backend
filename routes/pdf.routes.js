import express from 'express'
import { askQuestion, getDocument, getSingleDocument, uploadDcoument } from '../controller/pdf.controller.js';

import multer from "multer";
import path from "path";
import auth from '../utils/auth.js';

const pdfRoute=express.Router()



const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOCX, and TXT files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

pdfRoute.post("/upload",auth, upload.single("file"),uploadDcoument)


pdfRoute.post("/ask/:docId",auth,askQuestion)
pdfRoute.get("/documents",auth,getDocument)
pdfRoute.get("/documents/:docId",auth,getSingleDocument)



export default  pdfRoute;