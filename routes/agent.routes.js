import express from "express";

import { chatWithAgent, chatWithMcp } from "../controller/agent.controller.js";
import auth from "../utils/auth.js";


const agentRoutes = express.Router();

agentRoutes.post("/chat", auth,chatWithAgent );
agentRoutes.post("/mcp/chat",auth,chatWithMcp)

export default agentRoutes;
