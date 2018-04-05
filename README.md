# BeastBot
Automated SMS response for [dragon boat](https://en.wikipedia.org/wiki/Dragon_boat) teams.

## How to use
The bot will recognize two commands:
* `S`: **S** for **S**chedule
    * The bot will retrieve the team's schedule from a published Google Sheets URL and will send back:
        * the upcoming practice time;
        * the weather forecast for this day; 
        * and the Google Maps link if it's an uncommon training place.
        
![Schedule example](https://i.imgur.com/VIPmlbq.jpg)

* `L`: **L** for **L**ate
    * By specifying the amount of time you will be late in minutes, the team captains will receive a text message specifying who will be late. 
    * For example, if you will be 15 minutes late, you will send `L 15`.

## Rules
For the lateness command, there are security rules that have been implemented in order to avoid abuse. 

### Off hours
Captains will not be notified if you sent your lateness commmand during off-hours from `9PM` to `9AM`.

### Anti-spam
After sending one lateness command, you cannot send back another one after `1 minute`.

## Getting Started
These instructions will guide you on how to build an automated SMS bot for displaying practice hours and for notifying the team captains for late members. 

### Prerequisites
To make BeastBot work, you will need the following accounts:
* a Google account for Google Drive;
* a Twilio account for the bot.

## Google Drive & Google Sheets
The bot will download the CSV data of an existing Google Sheets file that you will create in your Google Drive. 

### Schedule
For practice schedules, make sure the Sheets document follows this template:

![Schedule format](https://i.imgur.com/CV4Q8TJ.png)

### Lateness
Create another tab for lateness command:

![User format](https://i.imgur.com/urzHVhN.png)

The cell phone numbers need to encrypted since they're sensitive information. The encryption method must be an AES 256-bit with  passphrase that you specify within Twilio's Environmental Variables for `ENCRYPT_KEY`.

Once everything is set up, you will need to [publish the Google Sheets tabs](https://support.google.com/docs/answer/37579) that you have just created and set the output format to **CSV**.

## Twilio 
[Twilio](https://www.twilio.com/) is a cloud communication platform allowing developpers to programmatically control voice calls and text messaging responses.

You will need to [buy a new phone number](https://www.twilio.com/pricing) with SMS capability from Twilio in order to continue.

### Twilio Functions
After buying a new phone number, you will use [Twilio Functions](https://www.twilio.com/functions) by navigating to the [Manage](https://www.twilio.com/console/runtime/functions/manage) page: 
1. Create a `new` function.
2. Select the `Blank` template.
3. In the Configuration section, make sure the Access Control for `Check for valid Twilio signature` is **unchecked**.
4. Copy the JavaScript code from [BeastBot.js](BeastBot.js).
5. Paste the JavaScript code in the `Configuration code` textbox. 
6. Scroll down to the bottom of the page and `Save`.

Head to the [Configure page](https://www.twilio.com/console/runtime/functions/configure) to set your project's variables and dependencies:

#### Environmental Variables
```
 • BOT_NAME           : Name of the bot
 • CITY               : Weather forecast 
 • DEGREE_TYPE        : C or F 
 • ENCRYPT_KEY        : Passphrase to decrypt sensitive information 
 • GOOGLE_SHEETS_URL  : Published URL of Google Sheets in CSV
 • MEMBERS_PID        : -                                           
 • MEMBERS_QUERY      : -                                           
 • SCHED_PID          : -                                           
 • SCHED_QUERY        : -                                           
 • UTC_OFFSET         : Timezone offset to correct server time
```

#### Dependencies
```
 • crypto-js          : 3.1.9-1
 • jquery             : 3.3.1
 • lodash             : 4.17.4
 • twilio             : 3.6.3
 • moment             : 2.21.0
 • papaparse          : 4.3.7
 • xmlhttprequest     : 1.8.0
 • util               : 0.10.3
 • fs                 : 0.0.1-security
 • xmldom             : 0.1.27
 • weather-js         : 2.0.0          
```

And it is done! Say `hello` to your bot!

![Lateness example](https://i.imgur.com/CXM1G3q.jpg)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments
* [BEAST! Dragonboat Club](https://www.facebook.com/BeastDragonboatClub)
* Fyūjon BEAST!
