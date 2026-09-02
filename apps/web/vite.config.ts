import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_BACKEND_PORT = 4783;
const DEFAULT_FRONTEND_PORT = 5183;

export default defineConfig(({ mode }) => {
  // Load all env vars (not just VITE_-prefixed ones) from apps/web/.env* files
  // plus the real process environment, so PORT stays in sync with the backend.
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };

  const backendPort = Number(env.PORT) || DEFAULT_BACKEND_PORT;
  const frontendPort = Number(env.WEB_PORT) || DEFAULT_FRONTEND_PORT;

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      // Fail loudly instead of silently drifting to another port — the proxy
      // target below is fixed at config-load time, so a silent port hop here
      // would desync the frontend from the URL the developer expects.
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
