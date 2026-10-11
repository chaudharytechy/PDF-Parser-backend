import { GoogleGenerativeAI } from "@google/generative-ai";

import { listFiles, searchPdf } from "../tools/listFiles.js";
import { createMcpClient } from "../mcp/mcpClient.js";
// import { searchPdf } from "../tools/searchPdf.js";
// import { getFile } from "../tools/getFile.js";
// import { getChatHistory } from "../tools/getChatHistory.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [
    {
      functionDeclarations: [
        {
          name: "list_files",
          description:
            "Get all PDF files uploaded by the currently authenticated user.",
          parameters: {
            type: "OBJECT",
            properties: {},
          },
        },

        {
          name: "search_pdf",
          description: `
Search the content of the user's PDF documents and answer questions using the retrieved content.

Use this tool whenever the user asks for information that may be present inside their PDFs, including:
- questions about PDF content
- names of people
- names of companies or entities
- contact information
- lists of names
- extracting entities mentioned in documents
- "all names", "all users", "all people", "all contacts", etc.

The backend automatically controls the PDF scope.
If a PDF is selected by the user, search only that PDF.
If no PDF is selected, search across all PDFs belonging to the user.

Do not refuse entity extraction. Use this tool when the user asks for entities or names contained in the PDFs.
`,
          parameters: {
            type: "OBJECT",
            properties: {
              query: {
                type: "STRING",
                description:
                  "The exact information the user wants to find or extract from the PDF content."
              }
            },
            required: ["query"]
          }
        },

        {
          name: "get_file",
          description:
            "Get details about a specific file belonging to the user.",
          parameters: {
            type: "OBJECT",
            properties: {
              fileId: {
                type: "STRING",
                description: "The ID of the file.",
              },
            },
            required: ["fileId"],
          },
        },

        {
          name: "get_chat_history",
          description:
            "Get previous chat messages for the user's PDF conversation.",
          parameters: {
            type: "OBJECT",
            properties: {
              fileId: {
                type: "STRING",
                description: "The ID of the PDF.",
              },
            },
            required: ["fileId"],
          },
        },
      ],
    },
  ],
});

export const agentService = async ({
  userId,
  message,
  docId, // selected PDF id, null = all PDFs
}) => {
  try {
    // console.log(userId, message, docId)
    const chat = model.startChat({
      history: [],
    });

    const result = await chat.sendMessage(message);

    const response = result.response;

    const parts =
      response.candidates?.[0]?.content?.parts || [];

    const functionCallPart = parts.find(
      (part) => part.functionCall
    );

    // No tool required
    if (!functionCallPart) {
      return {
        answer: response.text(),
        toolUsed: null,
      };
    }

    const functionCall =
      functionCallPart.functionCall;

    const toolName = functionCall.name;
    const args = functionCall.args || {};

    let toolResult;

    switch (toolName) {

      case "list_files":

        toolResult = await listFiles(userId);

        break;


      case "search_pdf":
        console.log(toolName)
        toolResult = await searchPdf({
          userId,
          query: args.query,
          docId, // frontend selected PDF
        });

        break;


      case "sumrize_pdf":
        // toolResult = await summarizeAllPdfs(
        //   userId,
        //   args.fileId
        // );  

        break;


      case "get_chat_history":

        // toolResult = await getChatHistory(
        //   userId,
        //   args.fileId
        // );

        break;


      default:

        throw new Error(
          `Unknown tool: ${toolName}`
        );
    }

    // console.log("Tool:", toolName);
    // console.log("Tool result:", toolResult);


    // Send tool result back to Gemini

    const finalResult = await chat.sendMessage([
      {
        functionResponse: {
          name: toolName,
          response: {
            result: toolResult,
          },
        },
      },
    ]);


    return {
      answer: finalResult.response.text(),
      toolUsed: toolName,
      toolResult,
    };

  } catch (error) {

    console.error(
      "Agent Service Error:",
      error
    );

    throw error;
  }
};



export const mcpService = async ({
  userId,
  message,
  docId,
  token
}) => {
  try {
    console.log("hittt", userId,
      message,
      docId,);

    const mcpClient = await createMcpClient(token);

    // Get tools from MCP Server
    const toolsResponse = await mcpClient.listTools();

    const functionDeclarations = toolsResponse.tools.map((tool) => {
      const { $schema, ...parameters } = tool.inputSchema;
      console.log(tool.name, tool.description, "ooo")
      return {
        name: tool.name,
        description: tool.description || "",
        parameters,
      };
    });

    const modelWithTools = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      tools: [
        {
          functionDeclarations,
        },
      ],
    });

    const chat = modelWithTools.startChat({
      history: [],
    });

    const result = await chat.sendMessage(message);

    const response = result.response;

    const parts =
      response.candidates?.[0]?.content?.parts || [];

    const functionCallPart = parts.find(
      (part) => part.functionCall
    );

    if (!functionCallPart) {
      return {
        answer: response.text(),
        toolUsed: null,
      };
    }

    const functionCall = functionCallPart.functionCall;

    const toolName = functionCall.name;
    const args = functionCall.args || {};

    const toolArguments = {
      ...args,
      userId,
      ...(docId ? { docId } : {}),
    };

    const toolResult = await mcpClient.callTool({
      name: toolName,
      arguments: toolArguments,
    });

    const finalResult = await chat.sendMessage([
      {
        functionResponse: {
          name: toolName,
          response: toolResult,
        },
      },
    ]);

    return {
      answer: finalResult.response.text(),
      toolUsed: toolName,
      toolResult,
    };

  } catch (error) {
    console.error("Agent Service Error:", error);
    throw error;
  }
};



// import axios from "axios";

// export const agentService = async ({
//   userId,
//   message
// }) => {

//   // 1. Fine-tuned ToolDecider
//   const { data } = await axios.post(
//     "http://localhost:8000/predict-tool",
//     {
//       query: message
//     }
//   );

//   console.log(
//     "ToolDecider:",
//     data
//   );

//   // 2. Selected tool
//   const toolName = data.tool;

//   // 3. Call MCP
//   const result = await mcpClient.callTool({
//     name: toolName,
//     arguments:
//       toolName === "search_pdf"
//         ? {
//             query: message
//           }
//         : {}
//   });

//   // 4. Return MCP result
//   return result;
// };