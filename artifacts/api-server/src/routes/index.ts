import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import openaiRouter from "./openai/conversations";
import accessKeysRouter from "./access-keys";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(accessKeysRouter);
router.use(openaiRouter);

export default router;
