const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const userRouter = require('./routes/User');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Routes
app.use("/user", userRouter);

// Port configuration
const port = process.env.PORT || 7800;

// Start the server
app.listen(port, () => {
  try {
    console.log(`Server is running on port ${port}`);
  } catch (error) {
    console.error(`Error in running the server: ${error}`);
  }
});
