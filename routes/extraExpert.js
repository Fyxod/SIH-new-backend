import mongoose, { Collection } from "mongoose";
import  extraExperts from "../models/extraExperts.js";
import express from 'express';
import { extraExpertSchema } from "../utils/zodSchemas";
import { safeHandler } from "../middlewares/safeHandler";
import ApiError from "../utils/errorClass";
import axios from 'axios'

const router = express.Router();

router.route
    .post("/giveme", safeHandler(async (req, res) => {
        console.log(req.body)
   const params =req.body;
   if(!params){
       throw new ApiError(400,"no experts found");
   }
   if(params.college==="IIT Delhi"){
    params.url="https://iitd.irins.org/searchc/search";
   }
   if(params.college==="IIT Bombay"){
    params.url="https://iitb.irins.org/searchc/search";
   }
   if(params.college==="IIT Kanpur"){
    params.url="https://iitk.irins.org/searchc/search";
   }

   const response = await axios.post('http://43.204.236.108:8000/extraExpert/giveme',params);
    if (!response.ok) {
        throw new ApiError(response.status, "Failed to fetch experts");
    }
    
    const experts = response.data
    let newExpertData = [];
    for(const expert of experts){
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

export default router;