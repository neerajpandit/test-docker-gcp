import express from "express";
// import { validateLabData } from "../middlewares/inputValidator.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { addTest, addTestParameter, addTestParameterRange } from "../controllers/testController.js";
import { addTestResult, generateFinalReport, getTestResult } from "../controllers/resultController.js";

const router = express.Router();

router.post("/addtest",addTest);
router.post("/add-test-parameter",addTestParameter);
router.post("/add-test-parameter-range",addTestParameterRange);
router.post("/test-result",addTestResult);
router.post("/generate-report",generateFinalReport);//not used
router.get("/get-test/:id",getTestResult)


export default router;