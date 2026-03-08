import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Production safety warning for mock authentication
  if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_AUTH === 'true') {
    console.error('⚠️  WARNING: USE_MOCK_AUTH is enabled in production! This is a security risk.');
    console.error('⚠️  Please set USE_MOCK_AUTH=false or remove it from environment variables.');
  }

  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  // Health check endpoint for monitoring
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now(), version: "4.5.0" });
  });

  // Serve static files from the 'web' directory
  const webPath = path.join(__dirname, "..", "web");
  app.use(express.static(webPath));

  // API documentation (Swagger UI)
  // In production the files land in dist/web (via `expo export`).
  // In development they live in public/.
  const publicPath = path.join(__dirname, "..", "..", "public");
  const resolveDocs = (file: string) => {
    const fromBuild = path.join(webPath, file);
    return fs.existsSync(fromBuild) ? fromBuild : path.join(publicPath, file);
  };
  app.get("/api/docs", (_req, res) => res.sendFile(resolveDocs("api-docs.html")));
  app.get("/api/openapi.json", (_req, res) => res.sendFile(resolveDocs("openapi.json")));

  // Register API routes
  const aiRoutes = await import("../routes/ai");
  const subscriptionRoutes = await import("../routes/subscription");
  app.use("/api/ai", aiRoutes.default);
  app.use("/api/subscription", subscriptionRoutes.default);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Wildcard route to serve index.html for client-side routing
  app.get("*", (req, res, next) => {
    // Skip if it's an API route that somehow wasn't caught
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(webPath, "index.html"));
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
