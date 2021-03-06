/****************************************************************************************************
 * BeastBot.js
 * Code used for Twilio Functions allowing paddlers to:
 * -    Receive schedule
 * -    Alert captains for lateness
 ****************************************************************************************************/

/****************************************************************************************************
 * Libs
 ****************************************************************************************************/
const Papa = require("papaparse");
const fetch = require("node-fetch");
const moment = require('moment');
const weather = require('weather-js');
const crypto = require('crypto');

/****************************************************************************************************
 * Global
 ****************************************************************************************************/
var CONTEXT;

/****************************************************************************************************
 * Debug
 ****************************************************************************************************/
var nb_request = 0;
var nb_sched_req = 0;
var nb_late_req = 0;
var nb_help_req = 0;
var history = [];

/****************************************************************************************************
 * Main
 ****************************************************************************************************/
exports.handler = function (context, event, callback) {

    CONTEXT = context;
    debugStartup(event);

    // Prepare markup
    let twiml = new Twilio.twiml.MessagingResponse();

    try {
        // Lowercase response
        const body = event.Body ? event.Body.toLowerCase().split(" ") : "";

        // Categorize
        switch (body[0]) {
            case 'f':
            case 't':
                switch (body[1]) {
                    case 's':
                        sendSchedule(twiml, callback, body);
                        break;
                    case 'l':
                        sendLateness(twiml, callback, body, event);
                        break;
                    case 'broadcast':
                        sendBroadcast(twiml, callback, body, event);
                        break;
                    default:
                        sendHelp(twiml, callback);
                        break;
                }
                break;
            case 'invite':
                sendInvite(twiml, callback, body, event);
                break;
            case 'n':
                sendNudes(twiml, callback);
                break;
            default:
                sendHelp(twiml, callback);
                break;
        }
    } catch (error) {
        console.log(error);
        sendError(twiml, callback, error);
    }
}

/****************************************************************************************************
 * Startup
 ****************************************************************************************************/
function debugStartup(event) {
    nb_request++;
    console.log("Request total: " + nb_request);

    // Update history
    history.push({
        user: event.From,
        command: event.Body,
        time: moment().utcOffset((-1) * CONTEXT.UTC_OFFSET).format("YYYY-MM-D HH:mm:ss")
    });

    // Show known last users
    if (history.length > 5) {
        console.log(history.splice(Math.max(history.length - 5, 1)));
    }
    else {
        console.log(history);
    }
}

/****************************************************************************************************
 * Schedule
 ****************************************************************************************************/
function sendSchedule(twiml, callback, body) {
    nb_sched_req++;
    console.log("Schedule request #" + nb_sched_req);

    if (body[0]) {
        let url_schedule =
            CONTEXT.GOOGLE_SHEETS_URL +
            CONTEXT.SCHED_PID +
            CONTEXT.SCHED_QUERY;

        // Download the CSV file and analyze it
        fetch(url_schedule)
            .then((resp) => resp.text())
            .then(function (data) {

                Papa.parse(data, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results, file) {

                        // Once completed, parse the results
                        console.log("Parsing complete: " + JSON.stringify(results.data), file);
                        let obj_results;

                        // Get the next practice time
                        results.data.some(function (d) {
                            obj_results = {};
                            obj_results.DateTime = moment(d.Date + " " + d.Hour, "YYYY-MM-DD HH:mm");
                            obj_results.Location = d.Location;
                            obj_results.LocationLink = d.LocationLink;
                            obj_results.IsCancelled = d.IsCancelled;
                            obj_results.Description = d.Description;

                            return d.Team == body[0] && moment().utcOffset((1) * CONTEXT.UTC_OFFSET, true).isSameOrBefore(obj_results.DateTime);
                        });
                        console.log(obj_results);

                        // Weather info
                        if (obj_results) {
                            weather.find({ search: CONTEXT.CITY, degreeType: CONTEXT.DEGREE_TYPE }, function (err, result) {
                                let weather_info;
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    result[0].forecast.forEach((d) => {
                                        if (obj_results.DateTime.format("YYYY-MM-DD") === d.date) {
                                            let weather_emoji = d.skytextday;
                                            if (d.skytextday.includes("Mostly") || d.skytextday.includes("Partly")) {
                                                weather_emoji = "⛅";
                                            }
                                            else if (d.skytextday.includes("Cloudy")) {
                                                weather_emoji = "☁️";
                                            }
                                            else if (d.skytextday.includes("Sunny")) {
                                                weather_emoji = "☀️";
                                            }
                                            else if (d.skytextday.includes("Snow")) {
                                                weather_emoji = "❄️";
                                            }
                                            else if (d.skytextday.includes("Rain")) {
                                                weather_emoji = "🌧️";
                                            }
                                            weather_info =
                                                d.low +
                                                " ~ " +
                                                d.high +
                                                "°" +
                                                CONTEXT.DEGREE_TYPE +
                                                ", " +
                                                d.precip +
                                                "%, " +
                                                weather_emoji;
                                        }
                                    });
                                }

                                // Build the body
                                let message = "Next practice:\n" +
                                    "• " + obj_results.DateTime.format("dddd, MMMM Do") + "\n" +
                                    "• " + obj_results.DateTime.format("h:mm a") + "\n" +
                                    "• " + obj_results.Location;

                                // Add weather info
                                if (weather_info) {
                                    message = message + "\n" +
                                        "• " + weather_info;
                                }

                                // Description
                                if (obj_results.Description) {
                                    message = message + "\n" +
                                        "• " + obj_results.Description;
                                }

                                // Cancellation info
                                if (obj_results.IsCancelled === "☑") {
                                    message = message + "\n" +
                                        "• Practice cancelled";
                                }

                                // Send
                                twiml.message(message);
                                if (obj_results.LocationLink && obj_results.IsCancelled !== "☑") {
                                    twiml.message(obj_results.LocationLink);
                                }
                                callback(null, twiml);
                            });
                        }
                        else {
                            twiml.message("Something went wrong. Contact your captains!");
                            callback(null, twiml);
                        }
                    }
                });
            });
    }
    else {
        twiml.message("Your number is not registered. Contact your captains!");
        callback(null, twiml);
    }
}

/****************************************************************************************************
 * Lateness
 ****************************************************************************************************/
function sendLateness(twiml, callback, body, event) {
    nb_late_req++;
    console.log("Lateness request #" + nb_late_req);

    if (body.length > 2 && body[2] && (body[2] === 'absent' || body[2] > 0 && body[2] <= 60)) {

        // The URL cannot be shortened: `runtime application timed out`
        // Environment key cannot be longer than 150 characters
        let url_members =
            CONTEXT.GOOGLE_SHEETS_URL +
            CONTEXT.MEMBERS_PID +
            CONTEXT.MEMBERS_QUERY;

        fetch(url_members)
            .then((resp) => resp.text())
            .then(function (data) {

                // Download the CSV file and analyze it
                Papa.parse(data, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results, file) {

                        // Once completed, parse the results
                        console.log("Parsing complete: " + JSON.stringify(results.data), file);
                        let arr_captains = [], arr_captains_name = [];
                        let obj_results, username, captain_username, phone;

                        // Distinguish user and captains
                        results.data.forEach((d) => {
                            phone = decrypt(d.Phone);
                            if (d.Team == body[0] && phone === event.From) {
                                username = decrypt(d.Name);
                            }
                            if (d.Team == body[0] && d.IsCaptain === "☑") {
                                captain_username = decrypt(d.Name);
                                obj_results = {};
                                obj_results.Phone = phone;
                                obj_results.Name = captain_username;
                                arr_captains_name.push(captain_username);
                                arr_captains.push(obj_results);
                            }
                        });

                        let body_msg = '';
                        let body_feedback = '';
                        if (body[2] === 'absent' && username && arr_captains.length > 0) {
                            // Absence
                            body_msg = username + " will be absent.";
                            body_feedback = "Acknowledged: absence.\n" +
                                "The captains of your team (" +
                                arr_captains_name +
                                ") have been notified."
                        }
                        else if (body[2] > 0 && body[2] <= 60 && username && arr_captains.length > 0) {
                            // Late
                            body_msg = username + " will be " + body[2] + " minutes late.";
                            body_feedback = "Acknowledged: " + body[2] + " minutes.\n" +
                                "The captains of your team (" +
                                arr_captains_name +
                                ") have been notified."
                        }
                        else {
                            // Unregistered number
                            twiml.message("Your number is not registered.\n" +
                                "Please contact your captains as soon as possible.");
                            callback(null, twiml);
                        }

                        arr_captains.forEach((o) => {
                            CONTEXT.getTwilioClient().messages.create({
                                from: event.To,
                                to: o.Phone,
                                body: body_msg
                            }, function () {
                                twiml.message(body_feedback);
                                callback(null, twiml);
                            });
                        });
                    }
                });
            });
    }
    else {
        twiml.message("Please specify how late will you be in minutes [0-60].\n" +
            "I.e.: \"L 15\" (meaning 15 minutes late)");
        callback(null, twiml);
    }
}

/****************************************************************************************************
 * Decrypting sensitive information
 ****************************************************************************************************/
function decrypt(text) {
    var decipher = crypto.createDecipher(CONTEXT.CRYPTO_ALGORITHM, CONTEXT.ENCRYPT_KEY);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');

    return dec;
}

/****************************************************************************************************
 * Send Nudes
 ****************************************************************************************************/
function sendNudes(twiml, callback) {
    twiml.message("Searching for paddler's nudes, please wait ...");
    twiml.message().media("http://hunkholder.pixoil.com/img/600");
    callback(null, twiml);
}

/****************************************************************************************************
 * Broadcast
 ****************************************************************************************************/
function sendBroadcast(twiml, callback, body, event) {
    if (CONTEXT.BROADCAST_ALLOWED) {
        let url_members =
            CONTEXT.GOOGLE_SHEETS_URL +
            CONTEXT.MEMBERS_PID +
            CONTEXT.MEMBERS_QUERY;

        fetch(url_members)
            .then((resp) => resp.text())
            .then(function (data) {

                Papa.parse(data, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results, file) {
                        console.log("Parsing complete: " + JSON.stringify(results.data), file);
                        let arr_members = [], obj_results, phone;

                        // Distinguish user and captains
                        results.data.forEach((d) => {
                            if (d.Team == body[0]) {
                                phone = decrypt(d.Phone);
                                obj_results = {};
                                obj_results.Phone = phone;
                                arr_members.push(obj_results);
                            }
                        });

                        let body_msg = getInviteMsg();
                        let body_feedback = 'Broadcast done';

                        arr_members.forEach((o) => {
                            CONTEXT.getTwilioClient().messages.create({
                                from: event.To,
                                to: o.Phone,
                                body: body_msg
                            }, function () {
                                twiml.message(body_feedback);
                                callback(null, twiml);
                            });
                        });
                    }
                });
            });
    }
    else {
        sendHelp(twiml, callback);
    }
}

/****************************************************************************************************
 * Send welcoming message to new members joining during the season
 ****************************************************************************************************/
function sendInvite(twiml, callback, body, event) {

    let url_members =
        CONTEXT.GOOGLE_SHEETS_URL +
        CONTEXT.MEMBERS_PID +
        CONTEXT.MEMBERS_QUERY;

    fetch(url_members)
        .then((resp) => resp.text())
        .then(function (data) {

            Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
                complete: function (results, file) {
                    console.log("Parsing complete: " + JSON.stringify(results.data), file);
                    let arr_members = [], arr_usernames = [], obj_results, phone, isCaptain;

                    // Distinguish user and captains
                    results.data.forEach((d) => {
                        phone = decrypt(d.Phone);
                        if (body.slice(1).includes(phone)) {
                            username = decrypt(d.Name);
                            obj_results = {};
                            obj_results.Phone = phone;
                            arr_usernames.push(username);
                            arr_members.push(obj_results);
                        }
                        if (phone === event.From && d.IsCaptain === "☑") {
                            isCaptain = true;
                        }
                    });

                    if (isCaptain) {
                        let body_msg = getInviteMsg();
                        let body_feedback = 'Invite done: ' + arr_usernames;

                        arr_members.forEach((o) => {
                            CONTEXT.getTwilioClient().messages.create({
                                from: event.To,
                                to: o.Phone,
                                body: body_msg
                            }, function () {
                                twiml.message(body_feedback);
                                callback(null, twiml);
                            });
                        });
                    }
                    else {
                        // Not allowed
                        twiml.message("This command is only available for captains.");
                        callback(null, twiml);
                    }
                }
            });
        });
}

/****************************************************************************************************
 * Help
 ****************************************************************************************************/
function sendHelp(twiml, callback) {
    nb_help_req++;
    console.log("Help request #" + nb_help_req);

    twiml.message("Welcome to " + CONTEXT.BOT_NAME + "!\n" +
        "The available commands are:\n" +
        "• 'T S' for 'S'chedule;\n" +
        "• 'T L' for 'L'ate + [?]:\n" +
        "   • \"T L 15\" for 15mins late;\n" +
        "   • \"T L absent\" for absence.\n" +
        "T: 1st letter of your 'T'eam");
    callback(null, twiml);
}

/****************************************************************************************************
 * Error
 ****************************************************************************************************/
function sendError(twiml, callback, error) {
    twiml.message("Oh no! " + CONTEXT.BOT_NAME + " could not understand your message.\n" +
        "Please try sending your command again.\n" +
        "Example: 'T S' or 'T L 15'");
    twiml.message("If the problem persist, send this to your team captain:");
    twiml.message(error.message);
    callback(null, twiml);
}

/****************************************************************************************************
 * Messages
 ****************************************************************************************************/
function getInviteMsg() {
    return "Hello! This is " + CONTEXT.BOT_NAME + ", your personal Dragonboat assistant.\n\n" +
        "If you do not recognize the sender or think this is a mistake, please ignore this message.\n\n" +
        "Start by saying 'Hello'!";
}