import { body } from "express-validator"

export const userLoginVals = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ max: 20, min: 3 })
    .withMessage("Username must be 3-20 characters")
    .matches(/^[a-z]+$/)
    .withMessage("Username can only contain lowercase letters"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters"),
]

export const userSignupVals = [
  ...userLoginVals,
  body("avatar")
    .notEmpty()
    .withMessage("Avatar is required")
    .isLength({ max: 8, min: 8 })
    .withMessage("Avatar must be 8 characters"),
]

export const userUpdateVals = [
  body("username")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 20, min: 3 })
    .withMessage("Username must be 3-20 characters")
    .matches(/^[a-z]+$/)
    .withMessage("Username can only contain lowercase letters"),
  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters"),
  body("avatar").optional({ values: "falsy" }).isLength({ max: 8, min: 8 }).withMessage("Avatar must be 8 characters"),
]

export const matchInsertVals = [
  body("opponentId")
    .notEmpty()
    .withMessage("Opponent ID is required")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid opponent ID format"),
  body("result")
    .notEmpty()
    .withMessage("Result must be a string")
    .isIn(["win", "loss", "draw"])
    .withMessage("Result must be win, loss, or draw"),
]
