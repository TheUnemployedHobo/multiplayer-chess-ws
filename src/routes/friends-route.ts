import { Router } from "express"
import { asyncHandler } from "express-error-toolkit"

import { friendGet } from "@/controllers/friends-controller"
import { validateJwt } from "@/middlewares/custom"

const route = Router()

route.get("/", validateJwt, asyncHandler(friendGet))

export default route
