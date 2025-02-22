import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { addSample } from "../controllers/sampleController.js";

const router = express.Router();

router.post("/",addSample);


export default router;