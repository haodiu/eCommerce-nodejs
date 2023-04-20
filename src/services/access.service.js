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
const KeyTokenService = require("./keytoken.service");
const { keys } = require("lodash");

const RoleShop = {
  SHOP: "001",
  WRITER: "002",
  EDITOR: "003",
  ADMIN: "004",
};

class AccessService {
  static handlerRefreshTokenV2 = async ({ keyStore, user, refreshToken }) => {
    /**
     * 1. check refreshToken used or not used, if used => delete keys
     * 2. check refreshToken in keyStore
     * 3. check shop was existed
     * 4. create a new pair token
     * 5. update token
     * 6. return data include user and a new pair token
     */

    // 1.
    const { userId, email } = user;
    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened. Please login again!");
    }

    // 2.
    if (keyStore.refreshToken !== refreshToken) {
      throw new AuthFailureError("Shop not registered!");
    }

    // 3.
    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new AuthFailureError("Shop not registered 2");
    }

    // 4.
    const tokens = await createTokenPair(
      { userId, email },
      keyStore.publicKey,
      keyStore.privateKey
    );

    // 5.
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken,
      },
    });

    // 6.
    return {
      user,
      tokens,
    };
  };

  static handlerRefreshToken = async (refreshToken) => {
    /**
     * 1. check refreshToken used and handle
     * 2. if used => delete all keyToken in keyStore
     * 3. else (good)
     *  - check refreshToken in keyStore
     *  - generate token
     *  - update refreshToken by tokens just generate
     * 4. return handlerRefreshToken
     */

    // 1.
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    );
    // handle if refreshToken used
    if (foundToken) {
      // verify to get info
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );

      //delete all keyToken in keyStore
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened! Please login again");
    }

    // 3.
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);
    if (!holderToken) {
      throw new AuthFailureError("Shop not registered - *");
    }

    // verifyToken
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );
    console.log(`[2]--`, { userId, email });

    // check email in dbs
    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new AuthFailureError("Shop not registered - **");
    }

    // generate token
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

  static login = async ({ email, password, refreshToken = null }) => {
    /**
     * 1. check email in dbs
     * 2. match password
     * 3. create accessToken and refreshToken
     * 4. generate token
     * 5. get data return login
     */

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
