import express from "express";
import {hpcontroller} from "../controllers/homepageController.js";
import {cbcontroller} from "../controllers/chatBotController.js"

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", hpcontroller.getHomepage);
    router.get("/webhook", cbcontroller.getWebhook);
    router.post("/webhook", cbcontroller.postWebhook);

    return app.use("/", router);
};

export const webRoutes = initWebRoutes;