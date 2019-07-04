from flask import Flask, request
import json

# PLAYERS
from . import bot_methods
from .dkatzmir_robocop import robocop
from .esiu_goodluck_exe import goodluck_exe
from .nisprute_meep import meep
from .qge_DummyBot import dummy_bot
from .y2miao_potential import potential
from.scl002_all_in_every_time import all_in

app = Flask(__name__)


@app.route("/bet", methods=['POST'])
def get_bot():
    player = request.json['state']['players'][request.json['state']['me']]

    if player['id'] == 9:
        # with open("ariel_data.txt", "a+") as outfile:
        #     json.dump(request.json, outfile)
        #
        # f = open("ariel_data.txt", "a+")
        # f.write(',')
        # f.close()
        return str(bot_methods.parzival(request.json))
    elif player['id'] == 10:
        # with open("bender_data.txt", "a+") as outfile:
        #     json.dump(request.json, outfile)
        #
        # f = open("bender_data.txt", "a+")
        # f.write(',')
        # f.close()
        return str(bot_methods.one_hit_wonder(request.json))
    elif player['id'] == 11:
        # with open("marvin_data.txt", "a+") as outfile:
        #     json.dump(request.json, outfile)
        #
        # f = open("marvin_data.txt", "a+")
        # f.write(',')
        # f.close()
        return str(bot_methods.mastermind(request.json))
    elif player['id'] == 12:
        # with open("r2d2_data.txt", "a+") as outfile:
        #     json.dump(request.json, outfile)
        #
        # f = open("r2d2_data.txt", "a+")
        # f.write(',')
        # f.close()
        return str(bot_methods.good_game(request.json))
    elif player['id'] == "5cc2228ca960de667cfd69ae":
        return str(robocop(request.json))
    elif player['id'] == "5cc222a1a960de667cfd69af":
        return str(goodluck_exe(request.json))
    elif player['id'] == "5cc222a8a960de667cfd69b0":
        return str(meep(request.json))
    elif player['id'] == "5cc222b0a960de667cfd69b1":
        return str(dummy_bot(request.json))
    elif player['id'] == "5cc222baa960de667cfd69b2":
        return str(potential(request.json))
    elif player['id'] == "5cc4881ba960de667cfd69b3":
        return str(all_in(request.json))
    elif player['id'] == "5cc49113a960de667cfd69b4":
        return str(bot_methods.RIP_bot(request.json))
    elif player['id'] == "5cc491f5a960de667cfd69b5":
        return str(bot_methods.ggez(request.json))
    elif player['id'] == "5cc492b0a960de667cfd69b6":
        return str(bot_methods.cash_machine(request.json))
    elif player['id'] == "5cc492b7a960de667cfd69b7":
        return str(bot_methods.the_joker(request.json))
    elif player['id'] == "5cc492c5a960de667cfd69b8":
        return str(bot_methods.full_house(request.json))
    elif player['id'] == "5cc492d7a960de667cfd69b9":
        return str(bot_methods.queen_of_hearts(request.json))
    elif player['id'] == "5cc492dfa960de667cfd69ba":
        return str(bot_methods.ace_bot(request.json))
    elif player['id'] == "5cc49406a960de667cfd69bb":
        return str(bot_methods.triton_bot(request.json))
    elif player['id'] == "5cc49412a960de667cfd69bc":
        return str(bot_methods.uc_my_cards(request.json))
    elif player['id'] == "5cc4941aa960de667cfd69bd":
        return str(bot_methods.deez_botz(request.json))
    elif player['id'] == "5c7b86475898d33c8000f05d":
        return print(str(bot_methods.leave_bot(request.json)))

    return str(0)
