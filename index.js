const express = require("express");

const task = {
  _id: "5fe4095bfe8f83112ce92e2a",
  task_name: "Write articles and contribute to open source daily",
  task_description: "Conjure up write-ups for how to get things done in time.",
  reminder_interval: "2 hours",
  due_date: "2021-01-17T16:18:51.639Z",
  set_date: "2021-01-13T12:15:37.639Z",
  status: "active",
  token: "5fe0c0dd19ea4f323c0b5d1a"
}

require("dotenv").config();
const app = express();

require("./config/prod")(app);
require("./config/db")();
require("./config/routes")(app);

let PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ⚙ 🔥`);
});
