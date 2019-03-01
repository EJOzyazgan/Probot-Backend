import sys


def bet_1(gamestate):
    print(gamestate)
    return 0


def bet_2(gamestate):
    print(gamestate)
    return gamestate.callAmount


def bet_3(gamestate):
    my_bot = gamestate.players[gamestate.me]
    half_buyin = gamestate.buyin * 0.5

    if my_bot.chips < half_buyin:
        return sys.maxsize
    return gamestate.callAmount


def bet_4(gamestate):
    gs = gamestate
    p = gs.players
    me = p[gs.me]

    if me.cards[0].rank != me.cards[1].rank:
        return gs.minimumRaiseAmount * 2
    elif me.chipsBet > 0:
        return gs.callAmount
    return 0
