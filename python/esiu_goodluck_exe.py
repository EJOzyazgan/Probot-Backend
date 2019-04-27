def goodluck_exe(game_state):
	gs = game_state['state']
	p = gs['players']
	me = p[gs['me']]
	three_quarters_buyin = game_state['state']['buyin'] * 0.75

	# if < three quarters of what I had, play safer
	if me['chips'] > three_quarters_buyin:
		if me['cards'][0]['rank'] == me['cards'][1]['rank']:
			return gs['minimumRaiseAmount'] * 2 + gs['callAmount']
		elif me['cards'][0]['type'] == me['cards'][1]['type']:
			return gs['minimumRaiseAmount'] + gs['callAmount']
		elif getValue(me['cards'][0]['rank']) == getValue(me['cards'][1]['rank']) + 1:
			return gs['callAmount']
		elif getValue(me['cards'][1]['rank']) == getValue(me['cards'][0]['rank']) + 1:
			return gs['callAmount']
		elif getValue(me['cards'][1]['rank']) == 1:
			if getValue(me['cards'][1]['rank']) + 1 == getValue(me['cards'][0]['rank']):
				return gs['callAmount']
			if getValue(me['cards'][1]['rank']) + 12 == getValue(me['cards'][0]['rank']):
				return gs['callAmount']
		elif getValue(me['cards'][0]['rank']) == 1:
			if getValue(me['cards'][0]['rank']) + 1 == getValue(me['cards'][1]['rank']):
				return gs['callAmount']
			if getValue(me['cards'][0]['rank']) + 12 == getValue(me['cards'][1]['rank']):
				return gs['callAmount']
		elif me['chipsBet'] > 0:
			return gs['callAmount']
		else:
			return gs['callAmount']
	else:		
		if me['cards'][0]['rank'] == me['cards'][1]['rank']:
			return gs['minimumRaiseAmount'] + gs['callAmount']
		elif me['cards'][0]['type'] == me['cards'][1]['type']:
			return gs['callAmount']
		elif getValue(me['cards'][0]['rank']) == getValue(me['cards'][1]['rank']) + 1:
			return gs['callAmount']
		elif getValue(me['cards'][1]['rank']) == getValue(me['cards'][0]['rank']) + 1:
			return gs['callAmount']
		elif gs['callAmount'] > me['chips'] / 3:
			return 0
		elif me['chipsBet'] > 0:
			return gs['callAmount']
		else:
			return 0
		
def isInt(s):
    try: 
        int(s)
        return True
    except ValueError:
        return False
def getValue(s):
    if s == "2":
		return 2
    if s == "3":
		return 3
    if s == "4":
		return 4
    if s == "5":
		return 5
    if s == "6":
		return 6
    if s == "7":
		return 7
    if s == "8":
		return 8
    if s == "9":
		return 9
    if s == "10":
		return 10
    if s == "J":
		return 11
    if s == "Q":
		return 12
    if s == "K":
		return 13
    if s == "A":
		return 1
    return 0
	
