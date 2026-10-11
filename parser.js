import fs from "fs";
import mammoth from "mammoth";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embed } from "./gemini.js";

import pdf from 'pdf-parse-new';

// export async function parseAndEmbed(filePath, type) {
//   let text = "";

//   // Extract text
//   if (type === "pdf") {
//   const dataBuffer = fs.readFileSync(filePath);

// const data=await pdf(dataBuffer)
//     text = data.text;
//   } else if (type === "docx") {
//     const data = await mammoth.extractRawText({ path: filePath });
//     text = data.value;
//   } else if (type === "text") {
//     text = fs.readFileSync(filePath, "utf-8");
//   } else {
//     throw new Error("Unsupported file type");
//   }

//   if (!text || text.trim().length === 0) {
//     throw new Error("Document has no text to embed");
//   }

//   // Chunk text
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 500,
//     chunkOverlap: 50,
//   });
//   const chunks = await splitter.splitText(text);

//   // Embed and upsert
//   const embeddings = await embed(chunks);

//   console.log(`Document processed: ${chunks.length} chunks embedded and upserted!`);
//   return embeddings;
// }

export async function parseAndEmbed(fileBuffer, type, userId, documentId) {
  let text = "";

  // Extract text
  if (type === "pdf") {
    const data = await pdf(fileBuffer);
    text = data.text;

  } else if (type === "docx") {
    const data = await mammoth.extractRawText({
      buffer: fileBuffer,
    });
    text = data.value;

  } else if (type === "text") {
    text = fileBuffer.toString("utf-8");

  } else {
    throw new Error("Unsupported file type");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Document has no text to embed");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const chunks = await splitter.splitText(text);

  const embeddings = await embed(
    chunks,
    userId,
    documentId
  );

  console.log(
    `Document processed: ${chunks.length} chunks embedded and upserted!`
  );

  return embeddings;
}