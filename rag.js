import dotenv from "dotenv"
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
dotenv.config()
// export async function createRAGChain() {
//     // 1. Embeddings (MUST match what you used to store vectors)

//     const embeddings = new GoogleGenerativeAIEmbeddings({
//         model: "gemini-embedding-001", // Gemini embedding model
//         apiKey: process.env.GEMINI_API_KEY
//     });

//     // 2. Pinecone connection
//     const pinecone = new Pinecone({
//         apiKey: process.env.PINECONE_API_KEY,
//     });

//     const index = pinecone.Index(process.env.PINECONE_INDEX);

//     const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
//         pineconeIndex: index,
//     });

//     const retriever = vectorStore.asRetriever({ k: 4 });

//     // 3. Gemini LLM
//     const llm = new ChatGoogleGenerativeAI({
//         model: "gemini-3-flash-preview",
//         temperature: 0,
//         apiKey: process.env.GEMINI_API_KEY
//     });

//     // 4. Prompt
//     const prompt = ChatPromptTemplate.fromTemplate(`
// Answer the question using ONLY the context below.
// If the answer is not in the context, say you don't know.

// Context:
// {context}

// Question:
// {question}
// `);

//     // 5. RAG Chain
//     // const chain = RunnableSequence.from([
//     //     {
//     //         context: async (input) => {
//     //             // const docs = await retriever.getRelevantDocuments(input.question);
//     //             const docs = await retriever.invoke(input.question);
//     //             return docs.map((d) => d.pageContent).join("\n\n");
//     //         },
//     //         question: (input) => input.question,
//     //     },
//     //     prompt,
//     //     llm,
//     //     new StringOutputParser(),
//     // ]);

//     const chain = RunnableSequence.from([
//         {
//             context: async (input) => {

//                 const docs = await retriever.invoke(
//                     input.question,
//                     {
//                         filter: {
//                             userId: input.userId.toString(),
//                             documentId: input.docId.toString(),
//                         },
//                     }
//                 );

//                 return docs
//                     .map((d) => d.pageContent)
//                     .join("\n\n");
//             },

//             question: (input) => input.question,
//         },

//         prompt,
//         llm,
//         new StringOutputParser(),
//     ]);

//     return chain;
// }

export async function createRAGChain() {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
  });

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX);

  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex: index,
    }
  );

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3-flash-preview",
    temperature: 0,
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = ChatPromptTemplate.fromTemplate(`
Answer the question using ONLY the context below.

IMPORTANT:
- Only use information from the provided context.
- Do not use information from other documents.
- If the answer is not present in the context, say "I don't know based on this document."
- Do not make up information.

Context:
{context}

Question:
{question}
  `);

  const chain = RunnableSequence.from([
    {
      context: async (input) => {
        const filter = {
          userId: input.userId.toString(),
          ...(input.docId && {
            documentId: input.docId.toString(),
          }),
        };

        const docs = await vectorStore.similaritySearch(
          input.question,
          4,
          filter
        );

        return docs
          .map((doc) => doc.pageContent)
          .join("\n\n");
      },


      question: (input) => input.question,
    },

    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
}