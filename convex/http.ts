import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { computeAIStats } from "./aggregations";

const http = httpRouter();

http.route({
  path: "/get-data",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token parameter" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const state = await ctx.runQuery(api.sync.getSyncState, { deviceId: token });
    
    if (!state) {
      return new Response(JSON.stringify({ error: "No data found for this token" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const parsedLogs = JSON.parse(state.logs);
    const aiStats = computeAIStats(parsedLogs);

    const responseBody = {
      logs: parsedLogs,
      achievements: JSON.parse(state.achievements),
      statistics: aiStats,
      lastSync: new Date(state.updatedAt).toISOString()
    };

    return new Response(JSON.stringify(responseBody, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }),
});

export default http;
