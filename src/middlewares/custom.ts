import type { RequestHandler } from "express"

import { UnauthenticatedError } from "express-error-toolkit"
import { type ValidationChain, validationResult } from "express-validator"

import { jwtHelper } from "@/lib/utils"

export const validateReq = (validators: ValidationChain[]): RequestHandler[] => [
  ...validators,
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json(errors.mapped())

    next()
  },
]

export const validateJwt: RequestHandler = (req, _, next) => {
  const authToken = req.headers.authorization
  if (!authToken) throw new UnauthenticatedError("JWT required")

  const verifiedToken = jwtHelper.verify(authToken)

  req.body = { ...req.body, userId: verifiedToken.userId }

  next()
}
