import express from "express";
import {hpcontroller} from "../controllers/homepageController.js";
import {cbcontroller} from "../controllers/chatBotController.js";
import {mcontroller} from "../controllers/messagesController.js";

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", hpcontroller.getHomepage);
    router.get("/webhook", cbcontroller.getWebhook);
    router.post("/webhook", cbcontroller.postWebhook);
    router.post("/messages", mcontroller.getMessagepage);

    return app.use("/", router);
};

export const webRoutes = initWebRoutes;