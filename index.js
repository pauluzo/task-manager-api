const express = require("express");

require("dotenv").config();
const app = express();

require("./config/prod")(app);
require("./config/db")();
require("./config/routes")(app);

let PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ⚙ 🔥`);
});
