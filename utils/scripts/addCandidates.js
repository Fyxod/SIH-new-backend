import axios from 'axios';
import fs from 'fs';
import config from '../../config/config.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../../sampleData/candidates.json');
const url = config.BASE_URL + '/candidate';
const subjects = [
    "6759dec07f5c01a59850caf5",
    "6759dec07f5c01a59850d159",
    "6759dec07f5c01a59850c922",
    "6759dec07f5c01a59850cdb3",
    "6759dec07f5c01a59850ccc9",
    "6759dec07f5c01a59850ce9d",
    "6759dec07f5c01a59850cbdf",
    "6759dec07f5c01a59850ca0b",
    "6759dec07f5c01a59850d242",
    "6759dec07f5c01a59850cf86",
    "6759dec07f5c01a59850d32c",
    "6759dec07f5c01a59850d06f",
    "6759dec07f5c01a59850d415",
    "6759dec07f5c01a59850d4ff",
    "6759dec07f5c01a59850d7ba",
    "6759dec07f5c01a59850d98b",
    "6759dec07f5c01a59850d5e8",
    "6759dec07f5c01a59850df02",
    "6759dec07f5c01a59850db5d",
    "6759dec07f5c01a59850dc46",
    "6759dec07f5c01a59850de18",
    "6759dec07f5c01a59850dd2f",
    "6759dec07f5c01a59850da74",
    "6759dec07f5c01a59850e2a8",
    "6759dec07f5c01a59850e1be",
    "6759dec07f5c01a59850e0d4",
    "6759dec07f5c01a59850e391",
    "6759dec07f5c01a59850e564",
    "6759dec07f5c01a59850d6d1",
    "6759dec07f5c01a59850e47a",
    "6759dec07f5c01a59850dfeb",
    "6759dec07f5c01a59850e64d",
    "6759dec07f5c01a59850d8a2",
    "6759dec07f5c01a59850e840",
    "6759dec07f5c01a59850e752"
]

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendCandidates = async () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const candidates = JSON.parse(data);

        for (let index = 0; index < candidates.length; index++) {
            const candidate = candidates[index];
            try {
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const response = await axios.post(url, { ...candidate, subject });
                console.log(`Candidate ${index + 1}: Successfully posted. Response:`, response.data);
            } catch (error) {
                console.error(`Candidate ${index + 1}: Failed to post. Error:`,
                    error.response ? error.response.data : error.message
                );
            }

            // Add a delay (e.g., 1 second)
            await delay(1000);
        }
    } catch (error) {
        console.error('Error reading or processing the JSON file:', error.message);
    }
};

sendCandidates();
