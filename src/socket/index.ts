import type { Server } from "socket.io"

import { jwtHelper } from "@/lib/utils"

const initiateSocketIO = (io: Server) => {
  io.use((socket, next) => {
    try {
      const { jwt } = socket.handshake.auth
      if (!jwt) return next(new Error("Unauthorized"))

      const { userId } = jwtHelper.verify(jwt)
      socket.data.userId = userId

      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    console.info(`Socket ${socket.data.userId} connected`)

    socket.on("disconnect", (reason) => {
      console.info(reason)
      console.info(`Socket ${socket.data.userId} disconnected`)
    })
  })
}

export default initiateSocketIO
