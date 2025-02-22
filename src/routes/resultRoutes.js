import express from "express";
import { validateLabData } from "../middlewares/inputValidator.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { addPatient, addPatientWithTest, getPatient,updateTestResults } from "../controllers/resultController.js";

const router = express.Router();

router.post("/add-patient-test",addPatient);
router.get("/test-result/:id",getPatient);
router.put("/update-test-result/:id",verifyToken,updateTestResults);


export default router;