import mongoose from "mongoose";
import fs from "fs";
import dotenv from 'dotenv';
import config from "../../config/config.js";
dotenv.config();

import { fileURLToPath } from 'url';
import path from 'path';
import extraExperts from "../../models/extraExperts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../../sampleData/iitd.json');

// Connect to MongoDB
mongoose.connect(config.database.uri).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// Read data from JSON file
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

(async () => {
    try {
        // Insert documents with empty college and department fields
        const experts = data.map(expert => ({
            expertId: expert.Expert_ID,
            name: expert.Name,
            designation: expert.Designation,
            department: expert.Department, // Leave department empty initially
            expertise: expert.Expertise,
            profileLink: expert.Profile_Link,
            college: "IIT Delhi" // Leave college empty initially
        }));

        // Insert into MongoDB
        await extraExperts.insertMany(experts);
        console.log('Documents inserted successfully');
        
    } catch (err) {
        console.error('Error processing data:', err);
    } finally {
        // Close the MongoDB connection
        mongoose.connection.close();
    }
})();
