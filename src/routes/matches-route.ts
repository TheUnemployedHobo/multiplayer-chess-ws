import { Router } from "express"
import { asyncHandler } from "express-error-toolkit"

import { matchGet } from "@/controllers/matches-controller"
import { validateJwt } from "@/middlewares/custom"

const route = Router()

route.get("/", validateJwt, asyncHandler(matchGet))

export default route
