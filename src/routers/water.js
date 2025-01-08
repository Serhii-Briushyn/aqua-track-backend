import { Router } from "express";

import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.use(authenticate);

export default router;
