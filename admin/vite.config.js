import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Admin dashboard dev server. The backend already enables CORS (origin: true),
// so the app can call it directly via VITE_API_URL (see src/lib/api.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // reachable on the LAN too
  },
});
