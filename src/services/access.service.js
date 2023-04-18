"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const { findByEmail } = require("./shop.service");
const { getInfoData } = require("../utils/index");
const { createTokenPair, verifyJWT } = require("../auth/authUltils");
const { TokenExpiredError } = require("jsonwebtoken");
const KeyTokenService = require("./keytoken.service");

const RoleShop = {
  SHOP: "001",
  WRITER: "002",
  EDITOR: "003",
  ADMIN: "004",
};

class AccessService {
  static handlerRefreshToken = async (refreshToken) => {
    // check this token used
    console.log(`hello 1`);
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    );
    // if this token used
    if (foundToken) {
      // decode to get info user
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );

      //delete all keyToken in keyStore
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened! Please login again");
    }

    // not exist --  good
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);
    if (!holderToken) {
      throw new AuthFailureError("Shop not registered 1");
    }

    // verifyToken
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );
    console.log(`[2]--`, { userId, email });

    // check userId
    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new AuthFailureError("Shop not registered 2");
    }

    // create new pair token
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    // update token
    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken,
      },
    });

    return {
      user: { userId, email },
      tokens,
    };
  };

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    return delKey;
  };

  /*
    1. check email in dbs
    2. match password
    3. create AT and RT
    4. generate token
    5. get data return login
    */

  static login = async ({ email, password, refreshToken = null }) => {
    // 1.
    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new BadRequestError("Shop not registered - login");
    }

    // 2.
    const match = await bcrypt.compare(password, foundShop.password);
    if (!match) {
      throw new AuthFailureError("Authentication error");
    }

    // 3.
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    // 4.
    const { _id: userId } = foundShop;
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      userId,
      publicKey,
      privateKey,
      refreshToken: tokens.refreshToken,
    });

    // 5.
    return {
      shop: getInfoData({
        fields: ["_id", "name", "email"],
        object: getInfoData({
          fields: ["_id", "name", "email"],
          object: foundShop,
        }),
      }),
      tokens,
    };
  };

  static signUp = async ({ name, email, password }) => {
    // check email exist
    const holderShop = await shopModel.findOne({ email }).lean().exec(); // Refactor this redundant 'await' on a non-promise when it hasn't .exec()
    if (holderShop) {
      throw new BadRequestError("Error: Shop already registered!");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      // create privateKey: sign token, publicKey: verify token
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      console.log({ privateKey, publicKey }); //save collection KeyStore

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey,
      });

      if (!keyStore) {
        return {
          code: "xxxx",
          message: "keyStore error!",
        };
      }

      // create keyTokenPair
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );
      console.log(`Created Token Success: `, tokens);

      return {
        code: 201,
        metadata: {
          shop: newShop,
          tokens,
        },
      };
    }

    return {
      code: 200,
      metadata: null,
    };
  };
}

module.exports = AccessService;
