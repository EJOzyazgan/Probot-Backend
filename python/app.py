from flask import Flask, request
import json

# PLAYERS
from . import bot_methods
from .dkatzmir_robocop import robocop
from .esiu_goodluck_exe import goodluck_exe
from .nisprute_meep import meep
from .qge_DummyBot import dummy_bot
from .y2miao_potential import potential
from .scl002_all_in_every_time import all_in

app = Flask(__name__)


@app.route("/1/bet", methods=['POST'])
def get_bot1():
    # with open("ariel_data.txt", "a+") as outfile:
    #     json.dump(request.json, outfile)
    #
    # f = open("ariel_data.txt", "a+")
    # f.write(',')
    # f.close()
    return json.dumps(bot_methods.triton_bot(request.json))#dummy_bot(request.json)
   

@app.route("/2/bet", methods=['POST'])
def get_bot2():
    # with open("ariel_data.txt", "a+") as outfile:
    #     json.dump(request.json, outfile)
    #
    # f = open("ariel_data.txt", "a+")
    # f.write(',')
    # f.close()
    return json.dumps(bot_methods.triton_bot(request.json))#robocop(request.json)

@app.route("/3/bet", methods=['POST'])
def get_bot3():
    # with open("ariel_data.txt", "a+") as outfile:
    #     json.dump(request.json, outfile)
    #
    # f = open("ariel_data.txt", "a+")
    # f.write(',')
    # f.close()
    return json.dumps(bot_methods.triton_bot(request.json))#dummy_bot(request.json)

@app.route("/4/bet", methods=['POST'])
def get_bot4():
    # with open("ariel_data.txt", "a+") as outfile:
    #     json.dump(request.json, outfile)
    #
    # f = open("ariel_data.txt", "a+")
    # f.write(',')
    # f.close()
    return json.dumps(bot_methods.triton_bot(request.json))

@app.route("/5/bet", methods=['POST'])
def get_bot5():
    # with open("ariel_data.txt", "a+") as outfile:
    #     json.dump(request.json, outfile)
    #
    # f = open("ariel_data.txt", "a+")
    # f.write(',')
    # f.close()
    return json.dumps(bot_methods.mastermind(request.json))

@app.route("/6/bet", methods=['POST'])
def get_bot6():
    # with open("ariel_data.txt", "a+") as outfile:
    #     json.dump(request.json, outfile)
    #
    # f = open("ariel_data.txt", "a+")
    # f.write(',')
    # f.close()
    return json.dumps(bot_methods.RIP_bot(request.json))