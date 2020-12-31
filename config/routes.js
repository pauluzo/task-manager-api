const express = require("express");
const cors = require("cors");
const user = require("../routes/user.route");
const task = require("../routes/task.route");

module.exports = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use("/api/user", user);
  app.use("/api/task", task);
};
