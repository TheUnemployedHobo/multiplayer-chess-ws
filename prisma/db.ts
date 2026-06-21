import "dotenv/config"

import { PrismaClient } from "@/database/client"

const db = new PrismaClient()

export default db
