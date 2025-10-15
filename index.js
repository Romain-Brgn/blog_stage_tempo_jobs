const path = require("path");
const express = require("express");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

// const session = require("express-session");
// const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/src/View"));

app.use(express.static(path.join(__dirname, "/src/Public")));
app.set("trust proxy", 1);

// ----ROUTES---- //

const routeAdmin = require("./src/Route/admin.route");
const routePublic = require("./src/Route/public.route");
const routeAuth = require("./src/Route/auth.route");

app.use("/admin", routeAdmin);
app.use("/auth", routeAuth);

// app.use("/posts", routePosts); @MEDINA TU DOIS DECLARER JUSTE AU DESSUS TA ROUTE
// app.use("/", routePublic);

// -------------- //

app.listen(port, () => {
  console.log(`Server is running ${port}`);
});
