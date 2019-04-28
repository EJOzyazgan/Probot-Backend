def all_in(game_state):
    gs = game_state['state']
    p = gs['players']
    me = p[gs['me']]
    if me['chipsBet'] == me['chips']:
        return 0
    return gs['chips']
