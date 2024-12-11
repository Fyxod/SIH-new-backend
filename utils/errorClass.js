class ApiError extends Error {
    constructor(statusCode, message, errorCode, data = {}) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.data = data;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;