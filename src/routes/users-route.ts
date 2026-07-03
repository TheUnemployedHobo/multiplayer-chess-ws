import { Router } from "express"
import { asyncHandler } from "express-error-toolkit"

import { userDelete, userGet, userLogIn, userRegister, userUpdate } from "@/controllers/users-controller"
import { userLoginVals, userSignupVals, userUpdateVals } from "@/lib/validators"
import { validateJwt, validateReq } from "@/middlewares/custom"

const route = Router()

route.post("/login", validateReq(userLoginVals), asyncHandler(userLogIn))
route.post("/register", validateReq(userSignupVals), asyncHandler(userRegister))
route.put("/", asyncHandler(validateJwt), validateReq(userUpdateVals), asyncHandler(userUpdate))
route.delete("/", asyncHandler(validateJwt), asyncHandler(userDelete))
route.get("/", asyncHandler(validateJwt), asyncHandler(userGet))

export default route
