import express from "express";
import {hpcontroller} from "../controllers/homepageController.js";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", hpcontroller.getHomepage);

    return app.use("/", router);
};

export const webRoutes = initWebRoutes;