import { Router } from "express"
import { asyncHandler } from "express-error-toolkit"

import { matchGet, matchInsert } from "@/controllers/matches-controller"
import { matchInsertVals } from "@/lib/validators"
import { validateJwt, validateReq } from "@/middlewares/custom"

const route = Router()

route.get("/", validateJwt, asyncHandler(matchGet))
route.post("/", validateJwt, validateReq(matchInsertVals), asyncHandler(matchInsert))

export default route
