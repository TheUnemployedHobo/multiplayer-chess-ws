import "dotenv/config"
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  datasource: { url: env("MONGODB_URI") },
  engine: "classic",
  migrations: { path: "prisma/migrations" },
  schema: "prisma/schema.prisma",
})
