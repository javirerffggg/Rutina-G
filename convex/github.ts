import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { computeAIStats } from "./aggregations";

// polyfill para unicode a base64
function utf8ToBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

export const syncToGithub = action({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.log("GITHUB_TOKEN no configurado. Saltando sincronización con GitHub.");
      return;
    }

    const state = await ctx.runQuery(api.sync.getSyncState, { deviceId: args.deviceId });
    if (!state) return;

    const parsedLogs = JSON.parse(state.logs);
    const aiStats = computeAIStats(parsedLogs);

    const responseBody = {
      logs: parsedLogs,
      achievements: JSON.parse(state.achievements),
      statistics: aiStats,
      lastSync: new Date(state.updatedAt).toISOString()
    };

    const contentStr = JSON.stringify(responseBody, null, 2);
    const contentBase64 = utf8ToBase64(contentStr);

    const owner = "javirerffggg";
    const repo = "Rutina-G";
    const path = "data/backup.json";
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    // 1. Obtener el SHA actual del archivo (necesario para sobrescribirlo)
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-Sync",
        "Accept": "application/vnd.github.v3+json"
      }
    });

    let sha = undefined;
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    // 2. Escribir el nuevo archivo
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-Sync",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: "backup: sincronización automática de entrenamientos",
        content: contentBase64,
        sha: sha
      })
    });

    if (!putRes.ok) {
      console.error("Error subiendo a GitHub:", await putRes.text());
    } else {
      console.log("Sincronización a GitHub completada con éxito.");
    }
  }
});
