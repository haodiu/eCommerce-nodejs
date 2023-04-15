'use strict'

const { CREATED } = require("../core/success.response")
const { options } = require("../routes")
const AccessService = require("../services/access.service")

class AccessController {
    signUp = async (req, res, next) => {
        new CREATED({
            message: 'Registered Ok!',
            metadata: await AccessService.signUp(req.body),
            options: {
                limit: 20
            }
        }).send(res)
    }
}

module.exports = new AccessController()