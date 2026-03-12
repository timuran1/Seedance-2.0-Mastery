import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // In-memory store for forum posts
  const posts: any[] = [
    {
      id: "1",
      author: "Seedance Team",
      avatar: "🌱",
      content: "Welcome to the Seedance 2.0 Community Forum! Share your best prompts here.",
      timestamp: Date.now() - 100000,
      likes: 5,
    }
  ];

  app.get("/api/posts", (req, res) => {
    res.json(posts);
  });

  io.on("connection", (socket) => {
    console.log("User connected to forum", socket.id);

    socket.on("new_post", (post) => {
      const newPost = {
        ...post,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        likes: 0,
      };
      posts.unshift(newPost);
      io.emit("post_added", newPost);
    });

    socket.on("like_post", (postId) => {
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.likes += 1;
        io.emit("post_updated", post);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
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
