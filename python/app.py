from flask import Flask, request

# PLAYERS
from . import bot_methods

app = Flask(__name__)


@app.route("/bet", methods=['POST'])
def get_bot():
    player = request.json['players'][request.json['me']]
    print('PLAYER: ', player['id'])

    if player['id'] == "5c7b86475898d33c8000f05a":
        return str(bot_methods.bet_5c7b86475898d33c8000f05a(request.json))
    elif player['id'] == "5c7b864c5898d33c8000f05b":
        return str(bot_methods.bet_5c7b864c5898d33c8000f05b(request.json))
    elif player['id'] == "5c7b86525898d33c8000f05c":
        return str(bot_methods.bet_5c7b86525898d33c8000f05c(request.json))
    elif player['id'] == "5c7b865a5898d33c8000f05d":
        return str(bot_methods.bet_5c7b865a5898d33c8000f05d(request.json))

    return str(0)
