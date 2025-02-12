
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      clientPort: 443,
      host: '4dadecf1-503f-48ab-8ca5-a4dfbf273434.lovableproject.com',
      protocol: 'wss'
    },
    watch: {
      usePolling: true
    },
    cors: {
      origin: [
        "https://lovable.dev",
        "https://gptengineer.app",
        "http://localhost:3000",
        "http://localhost:8080",
        "https://*.lovableproject.com"
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true
    },
    proxy: {
      '/gptengineer': {
        target: 'https://gptengineer.app',
        changeOrigin: true,
        secure: false
      }
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
}));
