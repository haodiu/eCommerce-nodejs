"use strict";

// const keytokenModel = require("../models/keytoken.model");
const { Types } = require("mongoose");
const keytokenModel = require("../models/keytoken.model");

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken,
  }) => {
    try {
      // level 0
      // const tokens = await keytokenModel.create({
      //     user: userId,
      //     publicKey,
      //     privateKey,
      //     refreshTokensUsed: [],
      //     refreshToken
      // })
      // return tokens ? tokens.publicKey : null

      // level xxx
      const filter = { user: userId };
      const update = {
        publicKey,
        privateKey,
        refreshTokenUsed: [],
        refreshToken,
      };
      const options = {
        upsert: true,
        new: true,
      };

      const tokens = await keytokenModel
        .findOneAndUpdate(filter, update, options)
        .exec();

      return tokens ? tokens.publicKey : null;
    } catch (error) {
      return error;
    }
  };

  static findByUserId = async (userId) => {
    return await keytokenModel
      .findOne({ user: new Types.ObjectId(userId) })
      .lean()
      .exec();
  };

  static removeKeyById = async (id) => {
    return await keytokenModel.deleteOne({ _id: id }).exec();
  };

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keytokenModel
      .findOne({ refreshTokensUsed: refreshToken })
      .lean()
      .exec();
  };

  static findByRefreshToken = async (refreshToken) => {
    return await keyTokenModel.findOne({ refreshToken }).exec();
  };

  static deleteKeyById = async (userId) => {
    return await keytokenModel.deleteOne({ user: new Types.ObjectId(userId) }).exec();
  };
}

module.exports = KeyTokenService;
