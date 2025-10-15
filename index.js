const path = require("path");
const express = require("express");
const newsletterRoute = require("./src/Route/newsletter.route");

require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

// const session = require("express-session");
// const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/newsletters", newsletterRoute);
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/src/View"));

app.use(express.static(path.join(__dirname, "/src/Public")));

// ----ROUTES---- //

const routeAdmin = require("./src/Route/admin.route");
const routePublic = require("./src/Route/public.route");
const routeAuth = require("./src/Route/auth.route");
const routeNewsletter = require("./src/Route/newsletter.route.js");

app.use("/admin", routeAdmin);
app.use("/auth", routeAuth);

// app.use("/", routePublic);

// -------------- //

app.listen(port, () => {
  console.log(`Server is running ${port}`);
});
