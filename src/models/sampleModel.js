import pool from "../config/db.js";


export const addSampleService = async(lab_id, name, color, status)=>{
    try{
        const result = await pool.query(
            "INSERT INTO sampletypes (lab_id, name, color, status) VALUES ($1, $2, $3, $4) RETURNING *",
            [lab_id, name, color, status]
        );
        return result.rows[0];
    }catch(error){
        console.error("Error in addSampleService:", error.message);
        throw new Error("Database Error while creating sample");
    }
}