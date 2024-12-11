import axios from 'axios';
import fs from 'fs';
import config from '../../config/config.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../../sampleData/experts.json');
const url = config.BASE_URL + '/expert';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendExperts = async () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const experts = JSON.parse(data);

        // Authenticate and set headers
        const response = await axios.post(config.BASE_URL + '/admin/signin', {
            username: 'superadmin',
            password: 'Pass@123'
        });
        const token = response.data.data.userToken;
        console.log(response.data);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['isMobile'] = 'true';

        // Process experts sequentially with a delay
        for (let index = 0; index < experts.length; index++) {
            const expert = experts[index];
            try {
                const postResponse = await axios.post(url, expert);
                console.log(`Expert ${index + 1}: Successfully posted. Response:`, postResponse.data);
            } catch (error) {
                console.error(`Expert ${index + 1}: Failed to post. Error:`,
                    error.response ? error.response.data : error.message
                );
            }
        }
    } catch (error) {
        console.error('Error reading or processing the JSON file:', error.message);
    }
};

sendExperts();
