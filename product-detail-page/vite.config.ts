
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/product": {
        target: "https://b2cqa.bufferbytes.in",
        changeOrigin: true,
        secure: true,
        rewrite: () =>
          "/customer/products/59bbc2b3-0ce0-45b6-91d6-efd1ecbb012f/",
      },
    },
  },
});





