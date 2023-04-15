'use strict'

const StatusCode = {
    FOBIDDEN: 403,
    CONFLICT: 409
}

const ResonStatusCode = {
    FOBIDDEN: 'Bad request error',
    CONFLICT: 'Conflict error'
}

class ErrorResponse extends Error {

    constructor(message, status) {
        super(message)
        this.status = status
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message = ResonStatusCode.CONFLICT, status = StatusCode.CONFLICT) {
        super(message, status)
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = ResonStatusCode.FOBIDDEN, status = StatusCode.FOBIDDEN) {
        super(message, status)
    }
}

module.exports = {
    ConflictRequestError,
    BadRequestError
}