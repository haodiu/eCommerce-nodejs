"use strict";

const { log } = require("console");
const mongoose = require("mongoose");
const os = require("os");
const _SECONDS = 5000;
const countConnect = () => {
  const numConnection = mongoose.connections.length;
  return numConnection;
};

const checkOverload = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;

    //Example maximum number of connections based on number of cores
    const maxConnections = numCores * 5;

    console.log(`Active connections: ${numConnection}`);
    console.log(`Memory usage: ${memoryUsage / 1024 / 1024} MB`);

    if (numConnection > maxConnections) {
      console.log(`Connections overload detected`);
    }
  }, _SECONDS); //Monitor every 5 seconds
};

module.exports = {
  countConnect,
  checkOverload,
};
