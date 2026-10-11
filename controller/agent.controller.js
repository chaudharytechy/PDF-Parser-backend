import { agentService, mcpService } from "../services/agent.service.js";


export const chatWithAgent = async (req, res) => {
  try {
    const { message, docId } = req.body;

    const userId = req.user.id;

    console.log(req.body,userId)
    // const result =await agentService
    const result = await agentService({
      userId,
      message,
      docId
    });

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Agent failed"
    });
  }
};


export const chatWithMcp = async (req, res) => {
  try {
    const { message, docId } = req.body;
    const userId = req.user.id;
  const token = req.cookies.pdfmindtoken;

    console.log("userId:", userId,token);
    console.log("authorization exists:", !!token);

    const result = await mcpService({
      userId,
      message,
      docId,
      token,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Agent failed",
    });
  }
};

