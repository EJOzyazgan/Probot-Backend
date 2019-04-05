from flask import Flask, request
import json

# PLAYERS
from . import bot_methods

app = Flask(__name__)


@app.route("/bet", methods=['POST'])
def get_bot():
    player = request.json['state']['players'][request.json['state']['me']]

    if player['id'] == "5c7b86475898d33c8000f05a":
        with open("ariel_data.txt", "a+") as outfile:
            json.dump(request.json, outfile)

        f = open("ariel_data.txt", "a+")
        f.write(',')
        f.close()
        return str(bot_methods.bet_5c7b86475898d33c8000f05a(request.json))
    elif player['id'] == "5c7b864c5898d33c8000f05b":
        with open("bender_data.txt", "a+") as outfile:
            json.dump(request.json, outfile)

        f = open("bender_data.txt", "a+")
        f.write(',')
        f.close()
        return str(bot_methods.bet_5c7b864c5898d33c8000f05b(request.json))
    elif player['id'] == "5c7b86525898d33c8000f05c":
        with open("marvin_data.txt", "a+") as outfile:
            json.dump(request.json, outfile)

        f = open("marvin_data.txt", "a+")
        f.write(',')
        f.close()
        return str(bot_methods.bet_5c7b86525898d33c8000f05c(request.json))
    elif player['id'] == "5c7b865a5898d33c8000f05d":
        with open("r2d2_data.txt", "a+") as outfile:
            json.dump(request.json, outfile)

        f = open("r2d2_data.txt", "a+")
        f.write(',')
        f.close()
        return str(bot_methods.bet_5c7b865a5898d33c8000f05d(request.json))

    return str(0)
