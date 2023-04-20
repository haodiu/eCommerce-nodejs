"use strict";

const { CREATED, SuccessResponse } = require("../core/success.response");
const { options } = require("../routes");
const AccessService = require("../services/access.service");

class AccessController {
  handlerRefreshToken = async (req, res, next) => {
    // new SuccessResponse({
    //     message: 'Get token success!',
    //     metadata: await AccessService.handlerRefreshToken(req.body.refreshToken)
    // }).send(res)

    // v2 fixed, no need accessToken
    new SuccessResponse({
      message: "Get token success!",
      metadata: await AccessService.handlerRefreshTokenV2({
        refreshToken: req.refreshToken,
        user: req.user,
        keyStore: req.keyStore,
      }),
    }).send(res);
  };

  login = async (req, res, next) => {
    new SuccessResponse({
      metadata: await AccessService.login(req.body),
    }).send(res);
  };

  logout = async (req, res, next) => {
    new SuccessResponse({
      message: "Logout success!",
      metadata: await AccessService.logout(req.keyStore),
    }).send(res);
  };

  signUp = async (req, res, next) => {
    new CREATED({
      message: "Registered Ok!",
      metadata: await AccessService.signUp(req.body),
      options: {
        limit: 20,
      },
    }).send(res);
  };
}

module.exports = new AccessController();
