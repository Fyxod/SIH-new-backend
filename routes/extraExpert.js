import mongoose from "mongoose";
import  extraExperts from "../models/extraExperts.js";
import express from 'express';
import { extraExpertSchema } from "../utils/zodSchemas";
import { safeHandler } from "../middlewares/safeHandler";
import ApiError from "../utils/errorClass";

const router = express.Router();

router.route('/')
.get(safeHandler(async (req, res) => {
    const { name, ...rest } = req.body;


a