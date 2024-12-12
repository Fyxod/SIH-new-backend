import mongoose, { Collection } from "mongoose";
import  extraExperts from "../models/extraExperts.js";
import express from 'express';
import { extraExpertSchema } from "../utils/zodSchemas";
import { safeHandler } from "../middlewares/safeHandler";
import ApiError from "../utils/errorClass";
import axios from 'axios'
import e from "express";

const router = express.Router();

router.route
    .post("/giveme", safeHandler(async (req, res) => {
   const params =req.body;
   if(!params){
       throw new ApiError(400,"no experts found");
   }
   if(Collage==="IIT Delhi"){
    params.url="https://iitd.irins.org/searchc/search";
   }
   if(Collage==="IIT Bombay"){
    params.url="https://iitb.irins.org/searchc/search";
   }
   if(Collage==="IIT Kanpur"){
    params.url="https://iitk.irins.org/searchc/search";
   }



   const response = await axios.post('http://43.204.236.108:8000/extraExpert/giveme',params);
    if (!response.ok) {
        throw new ApiError(response.status, "Failed to fetch experts");
    }
    const experts = await response.json();


    
    res.send(200,"all experts",experts);


    

}))

export default router;