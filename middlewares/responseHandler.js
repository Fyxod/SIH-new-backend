const responseHandler = (req, res, next) => {
    res.success = (statusCode, message, data = {}) => {
        return res.status(statusCode).json({
            status: "success",
            message,
            data
        });
    };

    res.error = (statusCode = 500, message = "Internal Server Error", errorCode = "INTERNAL_SERVER_ERROR", data = {}) => {
        return res.status(statusCode).json({
            status: "error",
            errorCode,
            message,
            data
        });
    };

    next();
};

export default responseHandler;