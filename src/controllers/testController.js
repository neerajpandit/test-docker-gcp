import pool from '../config/db.js';
import{ asyncHandler} from '../middlewares/asyncHandler.js';    

export const addTest1 = asyncHandler(async (req, res) => {
    const { lab_id, name, category, price, description,sample_type, unit, min_range, max_range, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO Tests (lab_id, name, category, price, description,sample_type, unit, min_range, max_range, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10) RETURNING *`,
            [lab_id, name, category, price, description,sample_type, unit, min_range, max_range, status || 'active']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export const addTest = asyncHandler(async (req, res) => {
    const { lab_id, name, department_id, sample_type_id, machine_id, price, description, unit, min_range, max_range, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO Tests (lab_id, name, department_id, sample_type_id, machine_id, price, description, unit, min_range, max_range, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [lab_id, name, department_id, sample_type_id, machine_id, price, description, unit, min_range, max_range, status || 'active']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export const addTestParameter = asyncHandler(async (req, res) => {
    const { test_id, parameter_name, parameter_code, type, unit, min_range, max_range, formula, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO TestParameters (test_id, parameter_name, parameter_code, type, unit, min_range, max_range, formula, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [test_id, parameter_name, parameter_code, type, unit, min_range, max_range, formula, status || 'active']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export const addTestParameterRange = asyncHandler(async (req, res) => {
    const { parameter_id, sex, age_range, min_value, max_value, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO TestParameterRanges (parameter_id, sex, age_range, min_value, max_value, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [parameter_id, sex, age_range, min_value, max_value, status || 'active']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export const addTestParameterOption = asyncHandler(async (req, res) => {
    const { parameter_id, option, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO TestParameterOptions (parameter_id, option, status)
             VALUES ($1, $2, $3) RETURNING *`,
            [parameter_id, option, status || 'active']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});