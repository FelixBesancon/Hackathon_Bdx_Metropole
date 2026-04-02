import path from "path";
import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config();

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
