require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const router = require("./routes/router");

const PORT = process.env.PORT || 5500;

const app = express();

app.use(bodyParser.json()); // How will the two systems be authenticated.

app.use("/", router);

app.listen(PORT, () => {
  console.log(`The server is listening on Port: ${PORT}`);
});
