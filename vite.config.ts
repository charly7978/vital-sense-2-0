
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Changed from "::" to "0.0.0.0" for better compatibility
    port: 8080,
    strictPort: true, // Add strict port to ensure it doesn't try alternative ports
    hmr: {
      clientPort: 443, // Force client to use HTTPS port
      host: `${process.env.VITE_PROJECT_ID}.lovableproject.com` // Use the project URL for WebSocket
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
