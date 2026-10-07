import type { NextApiRequest, NextApiResponse } from "next";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer } from "../../../lib/mcp";
import { db } from "../../../lib/firebase";

// In-memory store for SSE transports. 
// Note: In serverless environments (like Vercel), this may not persist across requests 
// if requests hit different serverless function instances. It works best in long-running Node.js servers.
const transports = new Map<string, SSEServerTransport>();

// Simple rate limit implementation (similar to checkRateLimit but adapted for Pages API)
async function checkRateLimitPages(req: NextApiRequest, limit: number, windowMs: number) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || "unknown-ip";
  if (ip === "unknown-ip") return { allowed: true };

  const ipKey = ip.replace(/[^a-zA-Z0-9.:-]/g, "");
  if (!ipKey) return { allowed: true };

  const rateLimitRef = db.collection("rate_limits").doc(ipKey);

  try {
    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const now = Date.now();

      if (doc.exists) {
        const data = doc.data();
        const expiresAt = typeof data?.expiresAt === 'number' ? data.expiresAt : data?.expiresAt?.toMillis?.() || 0;
        const count = data?.count || 0;

        if (now < expiresAt) {
          if (count >= limit) {
            return { allowed: false, retryAfter: Math.ceil((expiresAt - now) / 1000) };
          }
          transaction.update(rateLimitRef, { count: count + 1 });
          return { allowed: true };
        }
      }

      transaction.set(rateLimitRef, {
        count: 1,
        expiresAt: new Date(now + windowMs),
      });

      return { allowed: true };
    });
  } catch (error) {
    console.error("Rate limit error:", error);
    return { allowed: true };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate Limiting (10 requests per minute)
  const rateLimit = await checkRateLimitPages(req, 10, 60000);
  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfter));
    return res.status(429).send("Too Many Requests");
  }

  if (req.method === "GET") {
    // Start SSE connection
    const transport = new SSEServerTransport("/api/mcp", res as any);
    await transport.start();
    
    transports.set(transport.sessionId, transport);
    await mcpServer.connect(transport);

    // Clean up when connection closes
    res.on("close", () => {
      transports.delete(transport.sessionId);
    });
    return;
  }

  if (req.method === "POST") {
    // Handle incoming JSON-RPC messages
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);

    if (!transport) {
      return res.status(404).send("Session not found. Note: In serverless environments, sessions may not persist across requests.");
    }

    await transport.handlePostMessage(req as any, res as any);
    return;
  }

  res.status(405).send("Method Not Allowed");
}
