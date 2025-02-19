
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get the project ID from environment or fallback to the hostname
  const projectId = process.env.VITE_PROJECT_ID || '52f0fcc8-eaa0-4d9b-9c9e-7b37604df14f';
  const hmrHost = `${projectId}.lovableproject.com`;

  return {
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      hmr: {
        clientPort: 443,
        host: hmrHost,
        protocol: 'wss'
      }
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
