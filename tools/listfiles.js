import { Query } from 'mongoose'
import pdfModel from '../model/pdf.model.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createRAGChain } from '../rag.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const ragPromise = createRAGChain()
// async function fileDecider(files, query) {
//   const arrayOfFileName = files.map((file, index) => ({
//     index,
//     id: file._id.toString(),
//     name: file.originalname,
//   }))

//   const prompt = `
// You are a file-selection assistant.

// User query:
// "${query}"

// Available files:
// ${JSON.stringify(arrayOfFileName, null, 2)}

// Choose the file that is most relevant to the user's query.

// Return ONLY valid JSON:
// {
//   "id": "mongodb_file_id",
//   "name": "example.pdf",
//   "reason": "short explanation"
// }
// `

//   const result = await model.generateContent(prompt)
//   const response = result.response.text()

//   return JSON.parse(response)
// }



//  list all files available for particular users
export const listFiles = async (userId) => {
  const files = await pdfModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean()

  return files
}


export const resolveFile = async ({ userId, fileName }) => {
  const file = await pdfModel.findOne({
    userId,
    originalname: fileName,
  }).lean()

  if (!file) {
    throw new Error(`PDF not found: ${fileName}`)
  }

  return {
    fileId: file._id.toString(),
    fileName: file.originalname,
  }
}



// export const searchPdf = async ({ userId, query, docId }) => {
//   const ragChain = await ragPromise;

//   if (docId) {
//     return await ragChain.invoke({
//       userId,
//       docId,
//       question: query,
//     });
//   }

//   const files = await pdfModel
//     .find({ userId })
//     .sort({ createdAt: -1 })
//     .lean();

//   console.log("ALL FILES:", files);

//   const summary = await Promise.all(
//     files.map(async (file) => {
//       console.log("SEARCHING FILE:", {
//         id: file._id.toString(),
//         name: file.name,
//       });

//       const result = await ragChain.invoke({
//         userId,
//         docId: file._id.toString(),

//         // IMPORTANT:
//         // Don't ask the RAG for the filename.
//         question: query,
//       });

//       return {
//         docId: file._id.toString(),
//         fileName: file.name,
//         result,
//       };
//     })
//   );

//   return summary;
// };






//               User Query
//                   │
//                   ▼
//                Gemini
//                   │
//         ┌─────────┴─────────┐
//         │                   │
//  Specific PDF?          No PDF
//         │                   │
//        YES                  │
//         │                   │
//         ▼                   │
//  resolve_file               │
//  (userId + name)            │
//         │                   │
//         ▼                   │
//       docId                 │
//         │                   │
//         └─────────┬─────────┘
//                   ▼
//              search_pdf
//                   │
//           ┌───────┴───────┐
//           │               │
//        docId            no docId
//           │               │
//           ▼               ▼
//  userId + docId        userId
//           │               │
//           └───────┬───────┘
//                   ▼
//             Vector Search
//                   ↓
//             Relevant Chunks
//                   ↓
//                Gemini
//                   ↓
//              Final Answer
export const searchPdf = async ({ userId, query, docId }) => {
  const ragChain = await ragPromise;

  if (docId) {
    return await ragChain.invoke({
      userId,
      docId,
      question: query,
    });
  }

  const files = await pdfModel
    .find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  console.log("TOTAL FILES:", files.length);

  const summary = await Promise.all(
    files.map(async (file) => {
      const start = Date.now();

      console.log("SEARCHING FILE:", {
        id: file._id.toString(),
        name: file.name,
      });

      try {
        const result = await ragChain.invoke({
          userId,
          docId: file._id.toString(),
          question: query,
        });

        console.log("FINISHED FILE:", {
          name: file.name,
          time: `${Date.now() - start}ms`,
        });

        return {
          docId: file._id.toString(),
          fileName: file.name,
          result,
        };
      } catch (error) {
        console.error("FAILED FILE:", {
          name: file.name,
          time: `${Date.now() - start}ms`,
          error: error.message,
        });

        throw error;
      }
    })
  );

  return summary;
};
