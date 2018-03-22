"""
-----------------------------------------------------------------------------------------------
--- Introduction
-----------------------------------------------------------------------------------------------
--- To execute (replace the <...> with corresponding information):
---     BeastBot.py <account_sid> <auth_token> <user_phone> <twilio_phone>
---
--- Example:
---     BeastBot.py EX3250838ample43 example55435652 +10123456789 +10987654321
-----------------------------------------------------------------------------------------------
"""

"""
-----------------------------------------------------------------------------------------------
--- Imports
-----------------------------------------------------------------------------------------------
"""

import sys

from twilio.rest import Client

"""
-----------------------------------------------------------------------------------------------
--- Constants
-----------------------------------------------------------------------------------------------
"""

ACCOUNT_SID = 'account_sid'
AUTH_TOKEN = 'auth_token'
USER_PHONE = 'user_phone'
TWILIO_PHONE = 'twilio_phone'

"""
-----------------------------------------------------------------------------------------------
--- Functions
-----------------------------------------------------------------------------------------------
"""


def get_params(args):
    """ Extract the arguments entered with the Python command """

    if len(args) == 5:
        params = {
            ACCOUNT_SID: args[1],
            AUTH_TOKEN: args[2],
            USER_PHONE: args[3],
            TWILIO_PHONE: args[4]
        }
    else:
        sys.exit("Invalid parameters");

    return params


"""
-----------------------------------------------------------------------------------------------
"""


def authenticate(account_sid, auth_token):
    """ Client authentication """

    client = Client(account_sid, auth_token)

    return client


"""
-----------------------------------------------------------------------------------------------
"""


def send_message(client, recipient, sender, message):
    """ Send a message """

    message = client.messages.create(
        to=recipient,
        from_=sender,
        body=message
    )

    return message


"""
-----------------------------------------------------------------------------------------------
--- Main
-----------------------------------------------------------------------------------------------
"""


class Main:
    """ Workflow """

    params = get_params(sys.argv)
    client = authenticate(params[ACCOUNT_SID], params[AUTH_TOKEN])
    message = send_message(
        client,
        params[USER_PHONE],
        params[TWILIO_PHONE],
        "Hello from Python!"
    )

    print("Success!")
