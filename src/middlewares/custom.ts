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
  const { authorization } = req.headers
  if (!authorization) throw new UnauthenticatedError("JWT required")

  const { userId } = jwtHelper.verify(authorization)

  req.body = { ...req.body, userId }

  next()
}
