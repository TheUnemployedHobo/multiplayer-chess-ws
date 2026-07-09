import "dotenv/config"
import express from "express"
import { globalErrorHandler, notFoundHandler } from "express-error-toolkit"
import { createServer } from "node:http"
import { Server } from "socket.io"

import middlewares from "./middlewares"
import friendsRoute from "./routes/friends-route"
import matchesRoute from "./routes/matches-route"
import usersRoute from "./routes/users-route"
import initiateSocketIO from "./socket"

const app = express()
const server = createServer(app)
const io = new Server(server, { cors: { credentials: true, origin: "*" } })

app.use(middlewares)
app.use("/users", usersRoute)
app.use("/matches", matchesRoute)
app.use("/friends", friendsRoute)
app.use(notFoundHandler)
app.use(globalErrorHandler)

initiateSocketIO(io)

const PORT = +process.env["PORT"]!
const SERVER_URL = process.env["SERVER_URL"]!

server.listen(PORT, "0.0.0.0", () => console.info(`Server running at ${SERVER_URL}`))
