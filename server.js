const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose=require("mongoose")
const userRouter = require('./routes/User');
require('dotenv').config();
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Routes
app.use("/user", userRouter);

const port = process.env.PORT || 7800;
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("Database Connected Successfully"))
.catch((err)=>console.log("Error in connecting to DB",err))
app.listen(port, () => {
  try {
    console.log(`Server is running on port ${port}`);
  } catch (error) {
    console.error(`Error in running the server: ${error}`);
  }
});
