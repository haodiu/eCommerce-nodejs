'use strict'

const { route } = require('../app')

const express = require('express')
const router = express.Router()

router.use('/v1/api', require('./access')) 
// router.get('', (req, res, next) => {
//     return res.status(201).json({
//         message: "Hello, I'm Diu"
//     })
// })

module.exports = router