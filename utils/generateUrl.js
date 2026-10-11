import dotenv from "dotenv";
dotenv.config();
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// console.log( process.env.AWS_ACCESS_KEY_ID)
export const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});



export async function generateUploadURL(key) {
  const command = new GetObjectCommand({
    Bucket: "ngo-guru-bucket",
    Key: key
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 min
  // console.log(url,"pp")
  return url;
} 