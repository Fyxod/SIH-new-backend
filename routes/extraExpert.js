import extraExperts from "../models/extraExperts.js";
import express from 'express';
import { extraExpertSchema } from "../utils/zodSchemas.js";
import { safeHandler } from "../middlewares/safeHandler.js";
import ApiError from "../utils/errorClass.js";
import axios from 'axios'

const router = express.Router();

router.post("/giveme", safeHandler(async (req, res) => {
    console.log(req.body)
    const params = req.body;
    if (!params) {
        throw new ApiError(400, "no experts found");
    }
    if (params.college === "IIT Delhi") {
        params.url = "https://iitd.irins.org/searchc/search";
    }
    if (params.college === "IIT Bombay") {
        params.url = "https://iitb.irins.org/searchc/search";
    }
    if (params.college === "IIT Kanpur") {
        params.url = "https://iitk.irins.org/searchc/search";
    }
    if (params.college === "TIET") {
        params.url = "https://thapar.irins.org/searchc/search";
    }

    let response = null;
    try {
        response = await axios.post('http://43.204.236.108:8000/extraExpert/giveme', params);
    } catch (error) {
        console.log("VIDHU API ERROR", error);
        throw new ApiError(401, "Unauthorized", "UNAUTHORIZED")
    }

    const experts = response.data
    let newExpertData = [];
    for (const expert of experts) {
        const fields = expert;
        const newExpert = {
            expertId: fields.Expert_ID,
            name: fields.Name,
            designation: fields.Designation,
            expertise: fields.Expertise,
            profileLink: fields.Profile_Link
        };
        // const newDoc = extraExperts.create({
        //     expertId: fields.Expert_ID,
        //     name: fields.Name,
        //     designation: fields.Designation,
        //     expertise: fields.Expertise,
        //     profileLink: fields.Profile_Link
        // });

        newExpertData.push(newExpert);
    }

    res.success(200, 'Experts fetched successfully', newExpertData);

}))

router.post("/search/", safeHandler(async (req, res) => {
    const { department, college, expertise } = req.body;
    const expertiseArray = expertise.split(",");
    const query = {};

    if (department) {
        query.department = { $regex: new RegExp(`^${department}$`, 'i') };
    }
    if (college) {
        query.college = { $regex: new RegExp(`^${college}$`, 'i') };
    }
    if (expertiseArray && expertiseArray.length > 0) {
        query.expertise = { $in: expertiseArray };
    }

    const experts = await extraExperts.find(query);
    res.success(200, 'Experts fetched successfully', experts);

}));

export default router;