import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testy tylko dla czystej logiki z lib/ (bez Supabase i komponentów).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
