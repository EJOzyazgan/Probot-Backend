from flask import Flask, request

#PLAYERS
from . import bot_methods

app = Flask(__name__)


@app.route("/bet", methods=['POST'])
def getbot():
    return str(bot_methods.bet_1(request.json))
