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
    console.log(req.body);

    let expertiseArray = [];
    if (expertise) {
        expertiseArray = expertise.split(",");
    }
    
    const query = [];

    if (department && department !== "") {
        query.push({ department: { $regex: new RegExp(`^${escapeRegExp(department)}$`, 'i') } });
    }
    if (college && college !== "") {
        query.push({ college: { $regex: new RegExp(`^${escapeRegExp(college)}$`, 'i') } });
    }
    if (expertiseArray.length > 0) {
        query.push({ expertise: { $in: expertiseArray } });
    }

    // Use an empty array as fallback if no filters are provided.
    let experts = await extraExperts.find(query.length ? { $or: query } : {});

    let slicedExperts = experts.slice(0, 10).map(expert => ({
        ...expert.toObject(),
        relevancyScore: Math.floor(Math.random() * 10) + 1
    }));
    
    
    slicedExperts.sort((a, b) => b.relevancyScore - a.relevancyScore);
    
    res.success(200, 'Experts fetched successfully', { experts: slicedExperts });
}));



router.post('/search/beta', safeHandler(async (req, res) => {
    const { department, college, expertise } = req.body;
    console.log(req.body);
    const query = {};
    let expertiseArray = [];
    
    if (expertise) {
        expertiseArray = expertise.split(",");
        if(expertiseArray.length > 0) {
            query.recommendedSkills = expertiseArray
        }
    }

    if (department && department !== "") {
        query.department =  department;
    }

    if (college && college !== "") {
        query.college = college;
    }

    query.name = "parth";

    const experts = await extraExperts.find({});

    const newExperts = experts.map(expert => ({
        ...expert.toObject()
    }));
    
    // Helper function to delay execution
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Create a list of promises with delays
    const updatePromises = newExperts.map(async (expert, index) => {
        await delay(index * 10); // Ensure a delay of 10ms for each iteration
        expert.skills = expertiseArray;
        // console.log("expert", expert);
        // console.log("query", query)
        const newSubjectObject = {
            name: query.name,
            recommendedSkills: query.recommendedSkills
        }
        const newCandidateData = {
            name: expert.name,
            skills: expert.skills
        }

        const response = await axios.post('http://43.204.236.108:8000/matching/candy', { subjectData:newSubjectObject, candidateData: newCandidateData },
            {'X-API-KEY': "9bec235d70a084cf1092f7491c73c073"}
        );
        const data = response.data;
        expert.relevancyScore = data.relevancyScore;
        return expert;
    });
    
    await Promise.all(updatePromises);

    res.success(200, 'Experts fetched successfully', data); // what am i giving back here
}));

// Utility to escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');
}




export default router;