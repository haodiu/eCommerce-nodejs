'use strict'

const apiKeyModel = require('../models/apikey.model')
const crypto = require('crypto')

const findById = async (key) => {
    // const newKey = apiKeyModel.create({key: crypto.randomBytes(64).toString('hex'), permissions: ['0000']})
    // console.log(newKey);
    const objKey = apiKeyModel.findOne({key, status: true}).lean()
    return objKey
}

module.exports = {
    findById
}