//src/routers/water.js
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import {
    createWaterController,
    updateWaterController,
    deleteWaterController,
    getDailyWaterController,
    getMonthlyWaterController,
} from "../controllers/water.js";
import { createWaterSchema } from '../validation/water.js';
import { updateWaterSchema } from '../validation/water.js';
import { isValidId } from '../middlewares/isValidId.js';


const router = Router();

router.use(authenticate);

router.post("/",
    validateBody(createWaterSchema),
    ctrlWrapper(createWaterController)
);

router.patch(
    "/:id",
    isValidId,
    validateBody(updateWaterSchema),
    ctrlWrapper(updateWaterController)
);

router.delete("/:id", isValidId, ctrlWrapper(deleteWaterController));

router.get(
    "/daily",
    ctrlWrapper(getDailyWaterController)
);

router.get(
    "/monthly",
    ctrlWrapper(getMonthlyWaterController)
);
export default router;
