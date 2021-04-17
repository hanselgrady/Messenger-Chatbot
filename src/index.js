import "dotenv";
import express from "express";
import {viewEngine} from "./config/viewEngine.js";
import {webRoutes} from "./routes/web.js";
import bodyParser from "body-parser";

let app = express();
viewEngine(app);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
webRoutes(app);
let port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("App is running at the port " + port);
});

