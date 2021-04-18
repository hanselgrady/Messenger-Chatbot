import "dotenv";
import e from "express";
import request from "request";

let postWebHook = (req, res) => {
    // Parse the request body from the POST
    let body = req.body;
    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {
            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);        
            } 
            else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });
        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');
    }
    else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};

let getWebHook = (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.MY_VERIFY_FB_TOKEN;
    
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        }
        else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);      
        }
    }
};

let data = {
    "name": null,
    "birth": null
};
let hasAsked = {
    "name": false,
    "birth": false,
    "request": false,
    "nextbday": false,
    "response": false,
};
let start = false;

const nameRegex = "^[\\p{L} .'-]+$";
const dateRegex = "^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$";

// Handles messages events
function handleMessage(sender_psid, received_message) {
    let curr = new Date();
    let response;
    // Check if the message contains text
    if (received_message.text) {    
        // Create the payload for a basic text message
        if (!start) {
            response = {"text": `Hi! Let's start with first question.`};
            callSendAPI(sender_psid, response);
        }
        else {
            if (!hasAsked.name) {
                response = {"text": `What is your name?`};
                hasAsked.name = true;
            }
            else if (!hasAsked.birth) {
                if (nameRegex.test(received_message.text)) {
                    data.name = received_message.text;
                    response = {"text": `When is your birth date?`};
                    hasAsked.birth = true;
                }
                else {
                    response = {"text": `Name invalid. Try again.`};
                }
            }
            else if (!hasAsked.request) {
                if (dateRegex.test(received_message.text)) {
                    var splitData = received_message.text.split('-');
                    data.birth = new Date(splitData[0], splitData[1] - 1, splitData[2]);
                    response = {"text": `Thanks. You can ask about your next birthday now.`};
                    hasAsked.request = true;
                }
                else {
                    response = {"text": `Birth date invalid. Try again.`};
                }
            }
            else if (!hasAsked.nextbday) {
                var rem = getRemainingDays();
                if (received_message.text.includes("birthday") && received_message.text.includes("next")) {
                    response = {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "generic",
                                "elements": [{
                                    "title": `Is there ${rem} days before your next birthday?`,
                                    "subtitle": `Tap a button to answer`,
                                    "buttons": [
                                        {
                                            "type": "postback",
                                            "title": "Yes",
                                            "payload": "yes"
                                        },
                                        {
                                            "type": "postback",
                                            "title": "No",
                                            "payload": "no"
                                        }
                                    ]
                                }]
                            }
                        }
                    };
                    hasAsked.nextbday = true;
                }
                else {
                    response = {"text": `Sorry, I don't understand. Please try again.`};
                }
            }
            else if (!hasAsked.response) {
                if (received_message.text.includes("n") || received_message.text === "wrong" || received_message.text === "false") {
                    response = { "text": `There are 5 days before your next birthday` };
                }
                else if (received_message.text.includes("n") || received_message.text === "right" || received_message.text === "true") {
                    response = { "text": `Goodbye` };
                }
                resetState();
            }
        }
    }
    else {
        response = {"text": `Sorry, I only accept text (and button) input.`};
    }
    // Sends the response message
    callSendAPI(sender_psid, response);    
}

function resetState() {
    data = {
        "name": null,
        "birth": null
    };
    hasAsked = {
        "name": false,
        "birth": false,
        "request": false,
        "nextbday": false,
        "response": false,
    };
    start = false;
}

function getRemainingDays() {
    var today = new Date();
    var nextBday = new Date(data.birth);
    nextBday.setFullYear(today.getFullYear());
    if (nextBday - today < 0) {
        nextBday.setFullYear(today.getFullYear() + 1);
    }
    var diffTime = nextBday - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
    // Get the payload for the postback
    let payload = received_postback.payload;
    // Set the response based on the postback payload
    var rem = getRemainingDays();
    if (payload === 'yes') {
        response = { "text": `There are ${rem} days before your next birthday` };
    } else if (payload === 'no') {
        response = { "text": `Goodbye` };
    }
    resetState();
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v6.0/me/messages",
        "qs": { "access_token": process.env.FB_PAGE_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
            console.log(`Message: ${response}`);
        } else {
        console.error("Unable to send message:" + err);
        }
    }); 
}

export const cbcontroller = {
    postWebhook: postWebHook,
    getWebhook: getWebHook
};