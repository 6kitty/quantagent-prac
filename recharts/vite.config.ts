import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/quantagent-prac/",
  plugins: [react()],
  resolve: {
    conditions: ["module", "browser", "development", "import"],
  },
  optimizeDeps: {
    include: [
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
    ],
  },
});
