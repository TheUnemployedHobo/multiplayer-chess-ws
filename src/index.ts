import "dotenv/config"
import express from "express"
import { globalErrorHandler, notFoundHandler } from "express-error-toolkit"
import { createServer } from "node:http"

import middlewares from "./middlewares"
import friendsRoute from "./routes/friends-route"
import matchesRoute from "./routes/matches-route"
import usersRoute from "./routes/users-route"

const app = express()
const server = createServer(app)

app.use(middlewares)
app.use("/users", usersRoute)
app.use("/matches", matchesRoute)
app.use("/friends", friendsRoute)
app.use(notFoundHandler)
app.use(globalErrorHandler)

const PORT = process.env["PORT"]!
const SERVER_URL = process.env["SERVER_URL"]!

server.listen(PORT, () => console.info(`Server running at ${SERVER_URL}`))
