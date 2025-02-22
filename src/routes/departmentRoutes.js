import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { addDepartment } from "../controllers/departmentController.js";

const router = express.Router();

router.post("/",addDepartment);


export default router;