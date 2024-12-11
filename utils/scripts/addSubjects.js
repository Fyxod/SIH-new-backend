import axios from 'axios';
import fs from 'fs';
import config from '../../config/config.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../../sampleData/subjects.json');
const url = config.BASE_URL + '/subject';

const sendCandidates = async () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const subjects = JSON.parse(data);
        const response = await axios.post(config.BASE_URL + '/admin/signin', {
            username: 'superadmin',
            password: 'Pass@123'
            });
        const token = response.data.data.userToken;
        console.log(response.data);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['isMobile'] = 'true';
        const promises = subjects.map((subject, index) =>
            axios.post(url, subject)
                .then(response => ({
                    index: index + 1,
                    success: true,
                    response: response.data
                }))
                .catch(error => ({
                    index: index + 1,
                    success: false,
                    error: error.response ? error.response.data : error.message
                }))
        );

        const results = await Promise.all(promises);

        results.forEach(result => {
            if (result.success) {
                console.log(`Subject ${result.index}: Successfully posted. Response:`, result.response);
            } else {
                console.error(`Subject ${result.index}: Failed to post. Error:`, result.error);
            }
        });
    } catch (error) {
        console.log(error)
        console.error('Error reading or processing the JSON file:', error.message);
    }
};

sendCandidates();
