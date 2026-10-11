import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import pdfRoute from "./routes/pdf.routes.js";
import userRoute from "./routes/user.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/database.js";
import agentRoutes from "./routes/agent.routes.js";
import { createMcpServer } from "./mcp/pdfServer.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import auth from "./utils/auth.js";

dotenv.config();
const app = express();


app.use(cookieParser());
app.use(express.json());
connectDB()


// CORS
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Global Routes
app.use("/api/upload", pdfRoute)
app.use("/api/user", userRoute)

//Ai agent
app.use("/api/agent", agentRoutes)


// MCP
app.post("/api/mcp", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const mcpServer = createMcpServer({ userId });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await mcpServer.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "MCP server error",
        message: error.message,
      });
    }
  }
});



app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`MCP endpoint: http://localhost:${process.env.PORT}/mcp`);
});
