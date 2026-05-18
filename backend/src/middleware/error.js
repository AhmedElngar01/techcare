const { CustomError, ValidationError } = require('./validate');

const errorHandler = (err, req, res, next) => {
    console.error(err);
    
    if (err instanceof CustomError) {
        if (err instanceof ValidationError) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message,
                errors: err.errors
            });
        }
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    if (err.name === 'UnauthorizedError' || err.name === 'AuthError') {
        return res.status(401).json({ success: false, message: err.message });
    }
    
    if (err.name === 'ForbiddenError') {
        return res.status(403).json({ success: false, message: err.message });
    }
    
    if (err.name === 'NotFoundError') {
        return res.status(404).json({ success: false, message: err.message });
    }

    if (err.name === 'ConflictError') {
        return res.status(409).json({ success: false, message: err.message });
    }

    if (err.name === 'GeminiServiceError') {
        return res.status(503).json({ success: false, message: err.message });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};

module.exports = errorHandler;
