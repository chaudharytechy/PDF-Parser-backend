import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const createMcpClient = async (token) => {
  console.log(token)
  const client = new Client({
    name: "pdf-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(
    new URL("http://localhost:3000/api/mcp"),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  await client.connect(transport);

  console.log("MCP Client connected");

  return client;
};
