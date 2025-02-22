import { asyncHandler } from "../middlewares/asyncHandler.js";
import { addSampleService } from "../models/sampleModel.js";

export const addSample = asyncHandler(async (req, res) => {
    const { lab_id, name, color, status } = req.body;
    if (!lab_id || !name  || !status) {
        return res.status(400).json({ success: false, error: 'Please provide all fields' });
    }
    const sample = await addSampleService(lab_id,name,color, status);
    if (!sample) {
        return res.status(400).json({ success: false, error: 'Sample not added' });
    }
    res.status(201).json({ success: true, sample });
});