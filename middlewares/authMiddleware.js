import { verifyToken } from '../utils/jwtFuncs.js';
import config from '../config/config.js';

export default function checkAuth(role) { // role = minimum access level required (optional field)
    return (req, res, next) => {
        let token = null;

        if (req.headers['ismobile'] === "true" || req.headers['ismobile'] === true) {
            console.log("in the first block");
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.error(401, 'Missing or malformed token', 'UNAUTHORIZED');
            }
            token = authHeader.split(' ')[1];
        }

        else if (req.cookies?.userToken) {
            console.log("in the second block");
            token = req.cookies?.userToken;
        }

        else if (req.headers['authorization']) {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.error(401, 'Missing or malformed token', 'UNAUTHORIZED');
            }
            token = authHeader.split(' ')[1];
        }

        else if (req.headers.cookie) {
            console.log("in the third block");
            try {
                const userToken = req.headers?.cookie
                    .split('; ')
                    .find((entry) => entry.startsWith('userToken='))
                    .split('=')[1];
                token = userToken;
            } catch (error) {
                return res.error(401, 'Missing or malformed token', 'UNAUTHORIZED');
            }
        }

        console.log("Token printing here: ", token);

        const payload = verifyToken(token);
        if (!payload) {
            return res.error(401, 'Invalid or expired token', 'UNAUTHORIZED');
        }
        if (role && (!(payload.role in config.priority) || config.priority[payload.role] < config.priority[role])) {
            return res.error(403, 'Unauthorized access', 'FORBIDDEN');
        }
        req.user = payload;
        next();
    }
}