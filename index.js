const express = require("express");
const path = require("path");
// const session = require("express-session");
// const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/src/View"));

app.use(express.static(path.join(__dirname, "/src/Public")));

// ----ROUTES---- //

const routeAdmin = require("./src/Route/admin.route");
const routePublic = require("./src/Route/public.route");

app.use("/admin", routeAdmin);
// app.use("/", routePublic);

// -------------- //

app.listen(port, () => {
  console.log(`Server is running ${port}`);
});
