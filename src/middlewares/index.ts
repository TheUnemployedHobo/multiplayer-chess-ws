import compression from "compression"
import cors from "cors"
import { json, urlencoded } from "express"
import helmet from "helmet"
import morgan from "morgan"

export default [cors(), morgan("dev"), helmet(), compression(), json(), urlencoded({ extended: true })]
