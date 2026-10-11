import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

import { listFiles, searchPdf } from "../tools/listfiles.js";

export const createMcpServer = ({ userId }) => {
  const server = new McpServer({
    name: "pdf-server",
    version: "1.0.0",
  });

  server.tool(
    "list_files",
    `
List the PDF documents uploaded by the authenticated user.

IMPORTANT:
- Use this tool ONLY when the user wants to know which files/documents they have.
- Do NOT use this tool to answer questions about names, people, companies,
  contacts, entities, or information contained inside PDF files.
- This tool returns file metadata only.
`,
    {},
    async () => {
      console.log("MCP list_files userId:", userId);

      const files = await listFiles(userId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(files),
          },
        ],
      };
    }
  );

  server.tool(
    "search_pdf",
    `
Search and extract INFORMATION FROM THE CONTENT of the user's PDF documents.

ALWAYS use this tool when the user asks for information contained inside PDFs.

Examples:
- "find all names"
- "give me all names"
- "provide names across all files"
- "give me names from all PDFs"
- "find all people"
- "find all users"
- "find all companies"
- "find all contacts"
- "what names are in the PDFs?"
- "provide names according to file name"
- "give me names grouped by PDF"
- "find X across all files"

IMPORTANT TOOL SELECTION RULES:

1. If the user asks about CONTENT inside PDFs, use search_pdf.
2. If the user asks for names, people, companies, contacts, or entities
   inside PDFs, use search_pdf.
3. If the user says "all files", "all PDFs", or "across all files" and
   they are asking about PDF CONTENT, use search_pdf with NO docId.
4. If the user asks for information "according to file name", return
   results grouped by the PDF filename.
5. Only provide docId when the user explicitly selects a specific PDF.
6. Do NOT use list_files to answer questions about PDF content.

If docId is omitted, search across ALL PDFs belonging to the authenticated user.
`,
    {
      query: z.string().describe(
        "The information to find inside the PDF content. For example: 'find all person names and group them by PDF filename'."
      ),

      docId: z.string().optional().describe(
        "The ID of a specific PDF. Omit this when the user wants to search across all PDFs."
      ),
    },

    async ({ query, docId }) => {
      console.log("MCP search_pdf:", {
        userId,
        query,
        docId,
      });

      const result = await searchPdf({
        userId,
        query,
        docId,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );

  return server;
};

