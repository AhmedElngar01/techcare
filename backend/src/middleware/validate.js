const { validationResult } = require('express-validator');

class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

class ValidationError extends CustomError {
    constructor(errors) {
        super('Validation failed');
        this.statusCode = 422;
        this.errors = errors;
    }
}

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map(err => ({ field: err.path, message: err.msg }));
        throw new ValidationError(extractedErrors);
    }
    next();
};

module.exports = { validate, CustomError, ValidationError };
