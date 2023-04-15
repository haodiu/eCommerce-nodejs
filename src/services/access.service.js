'use strict'

const shopModel = require("../models/shop.model")
const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const KeyTokenService = require('./keytoken.service')
const createTokenPair = require("../auth/authUltils")
const {BadRequestError, ConflictRequestError} = require('../core/error.response')

const RoleShop = {
    SHOP: '001',
    WRITER: '002',
    EDITOR: '003',
    ADMIN: '004'
}

class AccessService {
    static signUp = async ({name, email, password}) => {
            // check email exist
            const holderShop = await shopModel.findOne({ email }).lean().exec() // Refactor this redundant 'await' on a non-promise when it hasn't .exec()
            if (holderShop) {
                throw new BadRequestError('Error: Shop already registered!')
            }
            
            const passwordHash = await bcrypt.hash(password, 10)

            const newShop = await shopModel.create({
                name, email, password: passwordHash, roles: [RoleShop.SHOP]
            })

            if (newShop) {
                // create privateKey: sign token, publicKey: verify token
                const privateKey = crypto.randomBytes(64).toString('hex')
                const publicKey = crypto.randomBytes(64).toString('hex')

                console.log({privateKey, publicKey})  //save collection KeyStore

                const keyStore = await  KeyTokenService.createKeyToken({
                    userId: newShop._id,
                    publicKey,
                    privateKey
                })


                if (!keyStore) {
                    return {
                        code: 'xxxx',
                        message: 'keyStore error!'
                    }
                }
                
                // create keyTokenPair
                const tokens = await createTokenPair({userId: newShop._id, email}, publicKey, privateKey)
                console.log(`Created Token Success: `, tokens);

                return {
                    code: 201,
                    metadata: {
                        shop: newShop,
                        tokens
                    }
                }

            }

            return {
                code: 200,
                metadata: null
            }
    }

}

module.exports = AccessService