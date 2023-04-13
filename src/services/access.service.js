'use strict'

const shopModel = require("../models/shop.model")
const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const { default: KeyTokenService } = require("./keyToken.service")
const createTokenPair = require("../auth/authUltils")
const RoleShop = {
    SHOP: '001',
    WRITER: '002',
    EDITOR: '003',
    ADMIN: '004'
}

class AccessService {
    static signUp = async ({name, email, password}) => {
        try {
            // check email exist
            const holderShop = await shopModel.findOne({ email }).lean()
            if (holderShop) {
                return {
                    code: 'xxxx',
                    message: 'shop already registered!'
                }
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

                const keyStore = await KeyTokenService.createKeyToken({
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
            
        } catch (error) {
            console.log(error);
            return {
                code: 'xxxx',
                message: error.message,
                status: 'error'
            }
        }
    }

}

module.exports = AccessService