import { config } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: path.join("prisma", "schema"),

  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "bun prisma/seed/main.ts",
  },

  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
