import random


# Folds every time, id a call if game_state.callAmount == 0
def parzival(game_state):
    my_bot = game_state['state']['players'][game_state['state']['me']]
    half_buyin = game_state['state']['buyin'] * 0.5

    if my_bot['chips'] < half_buyin:
        return my_bot['chips'] * 0.75
    return game_state['state']['callAmount']


# Call every time
def one_hit_wonder(game_state):
    return game_state['state']['callAmount']


# Gets bot from game_state
# If your chips are < half the buy in, go all in
# Otherwise call
def mastermind(game_state):
    my_bot = game_state['state']['players'][game_state['state']['me']]
    half_buyin = game_state['state']['buyin'] * 0.5

    if my_bot['chips'] < half_buyin:
        return my_bot['chips']
    return game_state['state']['callAmount']


# Gets bot from game_state
# If you have two of a kind raises for twice the minimum amount
# Otherwise calls
def good_game(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    if me['cards'][0]['rank'] == me['cards'][1]['rank']:
        return gs['minimumRaiseAmount'] * 2
    elif me['chipsBet'] > 0:
        return gs['callAmount']
    return 0


def RIP_bot(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    if me['chips'] * 0.2 <= gs['state']['callAmount']:
        return gs['state']['callAmount']
    return me['chips'] * 0.2


def ggez(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    if me['chips'] * 0.25 <= gs['state']['callAmount']:
        return gs['state']['callAmount']
    return me['chips'] * 0.25


def cash_machine(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    if me['chips'] > gs['callAmount']:
        return random.randint(gs['callAmount'], me['chips'])
    return 0


def the_joker(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    if me['chips'] * 0.90 > gs['callAmount']:
        return random.randint(gs['callAmount'], me['chips'] * 0.90)
    return 0


def full_house(game_state):
    return game_state['minimumRaiseAmount']


def queen_of_hearts(game_state):
    return game_state['minimumRaiseAmount'] * 1.25


def ace_bot(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    if me['cards'][0]['rank'] == 'A' or me['cards'][1]['rank'] == 'A':
        return gs['minimumRaiseAmount'] * 2
    return gs['callAmount']


def triton_bot(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    rank = 0

    if me['cards'][0]['rank'] == '8':
        rank += 8
    elif me['cards'][0]['rank'] == '9':
        rank += 9
    elif me['cards'][0]['rank'] == '10':
        rank += 10
    elif me['cards'][0]['rank'] == 'J':
        rank += 11
    elif me['cards'][0]['rank'] == 'Q':
        rank += 12
    elif me['cards'][0]['rank'] == 'K':
        rank += 13
    elif me['cards'][0]['rank'] == 'A':
        rank += 14

    if me['cards'][1]['rank'] == '8':
        rank += 8
    elif me['cards'][1]['rank'] == '9':
        rank += 9
    elif me['cards'][1]['rank'] == '10':
        rank += 10
    elif me['cards'][1]['rank'] == 'J':
        rank += 11
    elif me['cards'][1]['rank'] == 'Q':
        rank += 12
    elif me['cards'][11]['rank'] == 'K':
        rank += 13
    elif me['cards'][1]['rank'] == 'A':
        rank += 14

    if rank >= 16:
        return gs['minimumRaiseAmount'] * 1.5
    return gs['callAmount']


def uc_my_cards(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    rank = 0

    if me['cards'][0]['rank'] == '8':
        rank += 8
    elif me['cards'][0]['rank'] == '9':
        rank += 9
    elif me['cards'][0]['rank'] == '10':
        rank += 10
    elif me['cards'][0]['rank'] == 'J':
        rank += 11
    elif me['cards'][0]['rank'] == 'Q':
        rank += 12
    elif me['cards'][0]['rank'] == 'K':
        rank += 13
    elif me['cards'][0]['rank'] == 'A':
        rank += 14

    if me['cards'][1]['rank'] == '8':
        rank += 8
    elif me['cards'][1]['rank'] == '9':
        rank += 9
    elif me['cards'][1]['rank'] == '10':
        rank += 10
    elif me['cards'][1]['rank'] == 'J':
        rank += 11
    elif me['cards'][1]['rank'] == 'Q':
        rank += 12
    elif me['cards'][11]['rank'] == 'K':
        rank += 13
    elif me['cards'][1]['rank'] == 'A':
        rank += 14

    if rank >= 22:
        return gs['minimumRaiseAmount'] * 3
    elif rank >= 16:
        return gs['minimumRaiseAmount'] * 1.5
    return gs['callAmount']


def deez_botz(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    rank = 0

    if me['cards'][0]['rank'] == '8':
        rank += 8
    elif me['cards'][0]['rank'] == '9':
        rank += 9
    elif me['cards'][0]['rank'] == '10':
        rank += 10
    elif me['cards'][0]['rank'] == 'J':
        rank += 11
    elif me['cards'][0]['rank'] == 'Q':
        rank += 12
    elif me['cards'][0]['rank'] == 'K':
        rank += 13
    elif me['cards'][0]['rank'] == 'A':
        rank += 14

    if me['cards'][1]['rank'] == '8':
        rank += 8
    elif me['cards'][1]['rank'] == '9':
        rank += 9
    elif me['cards'][1]['rank'] == '10':
        rank += 10
    elif me['cards'][1]['rank'] == 'J':
        rank += 11
    elif me['cards'][1]['rank'] == 'Q':
        rank += 12
    elif me['cards'][11]['rank'] == 'K':
        rank += 13
    elif me['cards'][1]['rank'] == 'A':
        rank += 14

    if rank >= 22:
        if me['chips'] > gs['minimumRaiseAmount']:
            return random.randint(gs['minimumRaiseAmount'], me['chips'])
    return gs['callAmount']
