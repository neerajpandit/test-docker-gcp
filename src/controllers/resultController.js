import { asyncHandler } from "../middlewares/asyncHandler.js";
import pool from "../config/db.js";

// 📌 Add a new patient with tests
export const addPatientWithTest = asyncHandler(async (req, res, next) => {
    
    try {
        const assigned_by = req.userId;
        if (!assigned_by) {
            return res.status(401).json({ message: "Unauthorized Access" });
        }
        const {
            lab_id, first_name, last_name, email, phone, age, date_of_birth, gender, address,
            doctor_id, report_mode, blood_group,  test_status, test_date, sample_type,
            collection_type, remarks, test_ids
        } = req.body;

        if (!lab_id || !first_name || !age || !gender || !address || !test_ids?.length) {
            return res.status(400).json({ message: "Missing required fields or no tests assigned." });
        }

        // 🔍 Fetch Test Details from `Tests` Table
        const testQuery = `
            SELECT id AS test_id, name AS test_name, category, price, unit, min_range, max_range 
            FROM Tests 
            WHERE id = ANY($1) AND lab_id = $2;
        `;
        const { rows: testDetails } = await pool.query(testQuery, [test_ids, lab_id]);

        if (!testDetails.length) {
            return res.status(404).json({ message: "No valid tests found for given test IDs." });
        }

        // 🛠 Prepare JSONB Data for `test_results`
        const testResults = testDetails.map(test => ({
            test_id: test.test_id,
            test_name: test.test_name,
            category: test.category,
            price: test.price,
            unit: test.unit,
            min_range: test.min_range,
            max_range: test.max_range,
            result_value: null,
            result_status: "pending",
            remarks: ""
        }));

        const insertQuery = `
            INSERT INTO PatientWithTest (
                lab_id, first_name, last_name, email, phone, age, date_of_birth, gender, address, 
                doctor_id, report_mode, blood_group, assigned_by, test_status, test_results, 
                test_date, sample_type, collection_type, remarks
            ) 
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 
                $10, $11, $12, $13, $14, $15::JSONB, 
                $16, $17, $18, $19
            ) 
            RETURNING *;
        `;

        const { rows } = await pool.query(insertQuery, [
            lab_id, first_name, last_name, email, phone, age, date_of_birth, gender, address,
            doctor_id, report_mode, blood_group, assigned_by, test_status, JSON.stringify(testResults),
            test_date, sample_type, collection_type, remarks
        ]);

        return res.status(201).json({ message: "Patient added successfully!", data: rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Update test results

export const updateTestResults = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params; // Patient ID
        const { test_results } = req.body; // New test result values

        if (!test_results || !Array.isArray(test_results)) {
            return res.status(400).json({ message: "Invalid test results format." });
        }

        const updateQuery1 = `
            UPDATE PatientWithTest
            SET test_results = (
                SELECT jsonb_agg(
                    CASE 
                        WHEN test->>'test_id' IN (SELECT jsonb_array_elements_text($1::JSONB)->>'test_id') THEN 
                            jsonb_set(test, '{result_value}', to_jsonb(
                                (SELECT jsonb_array_elements($1::JSONB) 
                                WHERE jsonb_array_elements($1::JSONB)->>'test_id' = test->>'test_id')::JSONB->>'result_value'
                            )::JSONB, true)
                        ELSE 
                            test 
                    END
                ) 
                FROM jsonb_array_elements(test_results) AS test
            ),
            test_status = 'completed',
            updatedAt = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;
        const updateQuery = `
            UPDATE PatientWithTest
            SET 
                test_results = $1::JSONB,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;

        const { rows } = await pool.query(updateQuery, [
            JSON.stringify(test_results),
            id
        ]);

        if (!rows.length) {
            return res.status(404).json({ message: "Patient test results not found." });
        }

        return res.status(200).json({ message: "Test results updated successfully!", data: rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 📌 Get patient details with tests
export const getPatient = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        const selectQuery = `
            SELECT p.*, l.name AS lab_name, d.full_name AS doctor_name
            FROM PatientWithTest p
            LEFT JOIN Labs l ON p.lab_id = l.id
            LEFT JOIN Doctors d ON p.doctor_id = d.id
            WHERE p.id = $1;
        `;

        const { rows } = await pool.query(selectQuery, [id]);

        if (!rows.length) {
            return res.status(404).json({ message: "Patient not found." });
        }

        return res.status(200).json({ message: "Patient details fetched!", data: rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export const addPatient = asyncHandler(async (req, res) => {
    const { lab_id, first_name, last_name, email, phone, age, date_of_birth, gender, address, blood_group, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO Patients (lab_id, first_name, last_name, email, phone, age, date_of_birth, gender, address, blood_group, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [lab_id, first_name, last_name, email, phone, age, date_of_birth, gender, address, blood_group, status || 'active']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}); 

export const addTestResult = asyncHandler(async (req, res) => {
    const { patient_id, lab_id, test_id, assigned_by, test_status, test_results, sample_type_id, remarks } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO TestResults (patient_id, lab_id, test_id, assigned_by, test_status, test_results, sample_type_id, remarks)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [patient_id, lab_id, test_id, assigned_by, test_status || 'pending', JSON.stringify(test_results), sample_type_id, remarks]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//not used
export const generateFinalReport = asyncHandler(async (req, res) => {
    const { patient_id, test_id, test_results, remarks } = req.body;
    
    try {
      // Start a transaction
      await pool.query('BEGIN');
  
      // Fetch patient details
      const patientResult = await pool.query(
        `SELECT first_name, last_name, age, gender, blood_group FROM Patients WHERE id = $1`,
        [patient_id]
      );
      const patient = patientResult.rows[0];
  
      // Fetch test details
      const testResult = await pool.query(
        `SELECT name, description FROM Tests WHERE id = $1`,
        [test_id]
      );
      const test = testResult.rows[0];
  
      // Fetch test parameters and their ranges
      const parametersResult = await pool.query(
        `SELECT id, parameter_name, parameter_code, unit, min_range, max_range 
         FROM TestParameters WHERE test_id = $1`,
        [test_id]
      );
      const parameters = parametersResult.rows;
  
      // Prepare the final report
      const report = {
        patient: {
          name: `${patient.first_name} ${patient.last_name}`,
          age: patient.age,
          gender: patient.gender,
          blood_group: patient.blood_group,
        },
        test: {
          name: test.name,
          description: test.description,
        },
        results: [],
        remarks: remarks || "No remarks provided.",
      };
  
      // Add test results to the report
      for (const result of test_results) {
        const parameter = parameters.find((p) => p.id === result.parameter_id);
        if (parameter) {
          report.results.push({
            parameter_name: parameter.parameter_name,
            parameter_code: parameter.parameter_code,
            value: result.value,
            unit: parameter.unit,
            normal_range: `${parameter.min_range} - ${parameter.max_range}`,
            status: result.value >= parameter.min_range && result.value <= parameter.max_range ? "Normal" : "Abnormal",
          });
        }
      }
  
      // Save the report in the Reports table
      const reportUrl = `https://api.yourdomain.com/reports/${patient_id}_${test_id}.pdf`; // Example URL for the report
      const reportResult = await pool.query(
        `INSERT INTO Reports (patient_id, test_id, report_url, status, remarks)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [patient_id, test_id, reportUrl, 'generated', remarks]
      );
  
      // Commit the transaction
      await pool.query('COMMIT');
  
      // Return the final report
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      // Rollback the transaction in case of error
      await pool.query('ROLLBACK');
      res.status(500).json({ success: false, error: error.message });
    }
  });


export const getTestResult = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch test result details
        const resultQuery = await pool.query(
            `SELECT patient_id, test_id, lab_id, test_status, test_results, sample_type_id, remarks 
             FROM TestResults WHERE id = $1`,
            [id]
        );
        const testResult = resultQuery.rows[0];

        if (!testResult) {
            return res.status(404).json({ success: false, error: "Test result not found" });
        }

        // Fetch patient details
        const patientQuery = await pool.query(
            `SELECT first_name, last_name, age, gender, blood_group FROM Patients WHERE id = $1`,
            [testResult.patient_id]
        );
        const patient = patientQuery.rows[0];

        // Fetch test details
        const testQuery = await pool.query(
            `SELECT name, description FROM Tests WHERE id = $1`,
            [testResult.test_id]
        );
        const test = testQuery.rows[0];

        // Fetch sample type details
        const sampleTypeQuery = await pool.query(
            `SELECT name FROM SampleTypes WHERE id = $1`,
            [testResult.sample_type_id]
        );
        const sampleType = sampleTypeQuery.rows[0];

        // Ensure test_results is in valid JSON format
        let parsedResults;
        try {
            parsedResults = typeof testResult.test_results === 'string' 
                ? JSON.parse(testResult.test_results) 
                : testResult.test_results;
        } catch (error) {
            return res.status(500).json({ success: false, error: "Invalid test_results format" });
        }

        // Fetch all test parameters for the test
        const parametersQuery = await pool.query(
            `SELECT id, parameter_name, parameter_code, unit, min_range, max_range 
             FROM TestParameters WHERE test_id = $1`,
            [testResult.test_id]
        );
        const parameters = parametersQuery.rows;

        // Map results with parameter details
        const finalResults = parsedResults.map((result) => {
            const parameter = parameters.find((p) => p.id === result.parameter_id);
            return {
                parameter_name: parameter ? parameter.parameter_name : "Unknown",
                parameter_code: parameter ? parameter.parameter_code : null,
                unit: parameter ? parameter.unit : result.unit,
                value: result.value,
                normal_range: parameter ? `${parameter.min_range} - ${parameter.max_range}` : "N/A",
                status: parameter 
                    ? (result.value >= parameter.min_range && result.value <= parameter.max_range 
                        ? "Normal" 
                        : "Abnormal") 
                    : "Unknown",
            };
        });

        // Prepare the final response
        const finalTestResult = {
            patient: {
                name: `${patient.first_name} ${patient.last_name}`,
                age: patient.age,
                gender: patient.gender,
                blood_group: patient.blood_group,
            },
            test: {
                name: test.name,
                description: test.description,
            },
            lab_id: testResult.lab_id,
            test_status: testResult.test_status,
            sample_type: sampleType ? sampleType.name : null,
            results: finalResults,
            remarks: testResult.remarks,
        };

        // Return the test result
        res.status(200).json({ success: true, data: finalTestResult });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});














export const createResult = asyncHandler(async (req, res, next) => {
    try {
        const { patient_id, lab_id, assigned_by, test_ids } = req.body; // test_ids should be an array

        if (!patient_id || !lab_id || !assigned_by || !test_ids.length) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // 🔍 Fetch Test Details from `Tests` Table
        const testQuery = `
            SELECT id AS test_id, name AS test_name, category, price, unit, min_range, max_range 
            FROM Tests 
            WHERE id = ANY($1) AND lab_id = $2
        `;
        const { rows: testDetails } = await pool.query(testQuery, [test_ids, lab_id]);

        if (!testDetails.length) {
            return res.status(404).json({ message: "No valid tests found for given test IDs." });
        }

        // 🛠 Prepare JSONB Data for `test_results`
        const testResults = testDetails.map(test => ({
            test_id: test.test_id,
            test_name: test.test_name,
            category: test.category,
            price: test.price,
            unit: test.unit,
            min_range: test.min_range,
            max_range: test.max_range,
            result_value: null, // 🚀 Will be updated later
            result_status: "pending",
            remarks: ""
        }));

        // 🔄 Insert into `TestsResult`
        const insertQuery = `
            INSERT INTO TestsResult (patient_id, lab_id, assigned_by, test_results, test_status)
            VALUES ($1, $2, $3, $4::JSONB, 'pending')
            RETURNING *;
        `;
        const { rows: insertedRows } = await pool.query(insertQuery, [
            patient_id,
            lab_id,
            assigned_by,
            JSON.stringify(testResults)
        ]);

        return res.status(201).json({ message: "Test assigned successfully!", data: insertedRows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// {
//     "patient_id": 1,
//     "lab_id": 2,
//     "assigned_by": 3,
//     "test_ids": [1, 2, 3]
// }



export const updateResult = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { test_results } = req.body; // Expected to be an updated JSON array

        if (!test_results || !Array.isArray(test_results)) {
            return res.status(400).json({ message: "Invalid test results format." });
        }

        // 🔄 Update query
        const updateQuery = `
            UPDATE TestsResult
            SET test_results = $1::JSONB, test_status = 'completed', updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;

        const { rows } = await pool.query(updateQuery, [JSON.stringify(test_results), id]);

        if (!rows.length) {
            return res.status(404).json({ message: "Test result not found." });
        }

        return res.status(200).json({ message: "Test results updated successfully!", data: rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});