import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { analyzeHandler, enhanceHandler, filterHandler, translateHandler, directorHandler, posts } from "./lib/handlers";

async function startServer() {
  const app = express();
  const PORT = 3002;
  const httpServer = createHttpServer(app);

  app.use(express.json());

  // Forum endpoints
  app.get("/api/posts", (_req, res) => res.json(posts));
  app.post("/api/posts", (req, res) => {
    const { action, postId, author, avatar, content } = req.body;

    if (action === 'like') {
      const post = posts.find((p: any) => p.id === postId);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      post.likes += 1;
      return res.json(post);
    }

    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    const post = {
      id: Math.random().toString(36).substring(2, 9),
      author: author || 'Anonymous',
      avatar: avatar || '👤',
      content,
      timestamp: Date.now(),
      likes: 0
    };
    posts.unshift(post);
    return res.json(post);
  });

  // Gemini AI endpoints (API key stays server-side only)
  app.post("/api/analyze", analyzeHandler);
  app.post("/api/enhance", enhanceHandler);
  app.post("/api/filter", filterHandler);
  app.post("/api/translate", translateHandler);
  app.post("/api/director", directorHandler);

  // Seedance video generation endpoints (MUAPI key stays server-side only)
  app.post("/api/generate", async (req, res) => {
    const apiKey = process.env.MUAPI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'MUAPI_API_KEY not configured' });
    const { model, ...params } = req.body || {};
    if (!model) return res.status(400).json({ error: 'model required' });
    try {
      const response = await fetch(`https://api.muapi.ai/api/v1/${model}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(params),
      });
      res.status(response.status).json(await response.json());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/result", async (req, res) => {
    const apiKey = process.env.MUAPI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'MUAPI_API_KEY not configured' });
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const response = await fetch(`https://api.muapi.ai/api/v1/predictions/${id}/result`, {
        headers: { 'x-api-key': apiKey },
      });
      res.status(response.status).json(await response.json());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
