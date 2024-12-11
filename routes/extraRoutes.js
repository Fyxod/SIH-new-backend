import express from 'express';
import fs from 'fs';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';
import FormData from 'form-data';
import axios from 'axios';
import { generateToken } from '../utils/jwtFuncs.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.get('/parse', resumeUpload.single("resume"), safeHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No file uploaded", "NO_FILE_UPLOADED");
    }
    console.log(req.file);
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));
    // try {
    //     const response = await axios.post(`${process.env.AI_API}/resume/beta`, formData, {
    //         headers: {
    //             ...formData.getHeaders(),
    //             "X-API-Key": process.env.RESUME_PARSER_API_KEY
    //         },
    //         timeout: 6000
    //     });
    //     const data = response.data;
    //     const filteredData = Object.fromEntries(
    //         Object.entries(data).filter(([_, value]) => value != null)
    //     );

    //     if (filteredData.mobile_number) {
    //         filteredData.mobileNo = filteredData.mobile_number;
    //         delete filteredData.mobile_number;
    //     }
    //     if (filteredData.email) {
    //         filteredData.email = filteredData.email.toLowerCase();
    //     }
    //     if (filteredData.college_name) {
    //         filteredData.institute = filteredData.college_name;
    //         delete filteredData.college_name;
    //     }
    //     if (filteredData.company_name) {
    //         filteredData.currentDepartment = filteredData.company_name;
    //         delete filteredData.company_name;
    //     }
    //     const resumeToken = generateToken({ name: response?.data.name || "testname", email: response?.data.email || "testemail@gmail.com", resumeName: req.file.filename });
    //     res.cookie("resumeToken", resumeToken, { httpOnly: true });
    //     res.success(200, "Resume parsed successfully", { name: response?.data.name || "testname", email: response?.data.email || "testemail@gmail.com", skills: response?.data.skills || ["nodejs", "express", "react"], mobileNo: response.data.skills, resumeToken });

    // } catch (error) {
    //     console.error(error); // temp log
    //     if (error.code === 'ECONNABORTED') {
    //         // throw new ApiError(504, "Request timed out", "REQUEST_TIMEOUT");
    //     } else {
    //         // throw new ApiError(500, error.data?.message || "Error parsing resume", "RESUME_PARSE_ERROR");
    //         // throw new ApiError(500, "Error parsing resume", "RESUME_PARSE_ERROR");
    //     }
    // }
    try {
        const response = await axios.post(`${process.env.RESUME_UPLOAD_URL}/upload/resume`, formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
            });
        console.log(response.data);
        // fs.unlinkSync(req.file.path); // using promises instead
        const resumeToken = generateToken({ name: response?.data.name || "testname", email: response?.data.email || "testemail@gmail.com", resumeName: req.file.filename });

        fs.promises.unlink(req.file.path);
        res.success(200, "Resume uploaded successfully", { resumeToken })
    } catch (error) {
        console.error(error);
    }
}));

export default router;