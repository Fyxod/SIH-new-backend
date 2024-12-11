import config from "../config/config.js";
import jwt from "jsonwebtoken";
import ApiError from "./errorClass.js";

export function generateToken(payload) {
    try {
        return jwt.sign(payload, config.auth.tokenSecret, { expiresIn: config.auth.tokenExpiration });
    } catch (error) {
        console.log("Token signing failed: ", error);
        throw new ApiError(500, "Try logging in after some time", "TOKEN_SIGNING_FAILED" );//or should it be "INTERNAL_SERVER_ERROR"?
    }
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, config.auth.tokenSecret);
    } catch (err) {
        console.log("Token verification failed", err);
        return null; //or should it be throw new ApiError(401, "Invalid token", "INVALID_TOKEN")?
    }
}
