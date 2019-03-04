

# Folds every time, id a call if game_state.callAmount == 0
def bet_5c7b86475898d33c8000f05a(game_state):
    print(0)
    return 0


# Call every time
def bet_5c7b864c5898d33c8000f05b(game_state):
    print(1)
    return game_state['state']['callAmount']


# Gets bot from game_state
# If your chips are < half the buy in, go all in
# Otherwise call
def bet_5c7b86525898d33c8000f05c(game_state):
    print(2)
    my_bot = game_state['state']['players'][game_state['state']['me']]
    half_buyin = game_state['state']['buyin'] * 0.5

    print('MY BOT', my_bot)

    if my_bot['chips'] < half_buyin:
        return my_bot['chips']
    return game_state['state']['callAmount']


# Gets bot from game_state
# If you have two of a kind raises for twice the minimum amount
# Otherwise calls
def bet_5c7b865a5898d33c8000f05d(game_state):
    print(3)
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]

    if me['cards'][0]['rank'] != me['cards'][1]['rank']:
        return gs['minimumRaiseAmount'] * 2
    elif me['chipsBet'] > 0:
        return gs['callAmount']
    return 0
