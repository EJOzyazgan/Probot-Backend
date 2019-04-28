import numpy as np
import functools

card_type = ['S', 'C', 'D', 'H']
card_code = {}
for i in range(len(card_type)):
    card_code[card_type[i]] = i
# define the rank of single card from lowest to highest
#                0,   1,   2,   3,   4,   5,   6,   7,    8,   9,  10,  11,  12
single_card = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
single_rank = {}
for i in range(len(single_card)):
    single_rank[single_card[i]] = i
# define the rank of full hand from lowest to highest
hand_type = ['Highcard', 'Pair', 'Two pairs', 'Three of a kind', 'Straight', \
             'Flush', 'Full house', 'Four of a kind', 'Straight flush', \
             'Royal flush']
hand_rank = {}
for i in range(len(hand_type)):
    hand_rank[hand_type[i]] = i


def card_preprocess(cards):
    # cards is a list of [{'rank':_, 'type':_}]
    cards = [[single_rank[cards[i]['rank']], card_code[cards[i]['type']]] for i in range(len(cards))]
    cards.sort()
    return cards


"""
randomly sample several possible configurations, and calculate the expectation of reward
"""


def suit_checker(cards):
    if cards[0][1] == cards[1][1] and cards[1][1] == cards[2][1] and cards[2][1] == cards[3][1] \
            and cards[3][1] == cards[4][1]:
        return True
    else:
        return False


def straight_checker(cards):
    if cards[0][0] + 1 == cards[1][0] and cards[1][0] + 1 == cards[2][0] and cards[2][0] + 1 == cards[3][0] \
            and cards[3][0] + 1 == cards[4][0]:
        return True
    else:
        return False


def suit_first_cmp(card1, card2):
    return (card1[1] - card2[1]) * 15 + (card1[0] - card2[0])


def best_hand(cards, revealed_cards):
    # obrain the best hand given all cards (7 cards)
    cards = cards + revealed_cards
    cards_value = sorted(cards)
    card_count = [0 for i in range(13)]
    for card in cards:
        card_count[card[0]] += 1
    # first use value to determine
    if card_count[12] > 0 and card_count[11] > 0 and card_count[10] > 0 and card_count[9] > 0 and card_count[8] > 0:
        return 'Royal flush', 0, 0, 0, 0, 0
    # check suit
    cards_suit = sorted(cards, key=functools.cmp_to_key(suit_first_cmp))
    # if ace included, then ace can also be treated as -1
    str_cards_suit = list(cards_suit)
    for card in cards_suit:
        if card[0] == 12:
            str_cards_suit.append([-1, card[1]])
    str_cards_suit.sort(key=functools.cmp_to_key(suit_first_cmp))
    max_str_suit = -1
    for i in range(len(str_cards_suit) - 4):
        if suit_checker(str_cards_suit[i:i + 5]) and straight_checker(str_cards_suit[i:i + 5]):
            if str_cards_suit[i + 4][0] > max_str_suit:
                max_str_suit = str_cards_suit[i + 4][0]
    if max_str_suit > 0:
        return 'Straight flush', max_str_suit, 0, 0, 0, 0

    # Four of a kind
    first_four = -1
    single_large = -1
    for i in range(len(cards_value) - 1, -1, -1):
        if card_count[cards_value[i][0]] >= 4:
            if first_four == -1:
                first_four = cards_value[i][0]
                continue
        if card_count[cards_value[i][0]] > 0:
            if first_four != cards_value[i][0] and single_large == -1:
                single_large = cards_value[i][0]
    if first_four != -1:
        return 'Four of a kind', first_four, single_large, 0, 0, 0

    # won't have four of a kind
    first_three = -1
    first_two = -1
    for i in range(len(cards_value) - 1, -1, -1):
        if card_count[cards_value[i][0]] >= 3:
            if first_three == -1:
                first_three = cards_value[i][0]
                continue
        if first_three != cards_value[i][0] and card_count[cards_value[i][0]] >= 2:
            if first_two == -1:
                first_two = cards_value[i][0]
    if first_three >= 0 and first_two >= 0:
        return 'Full house', first_three, first_two, 0, 0, 0

    max_suit = -1
    max_suitidx = -1  # i:i+5
    for i in range(len(cards_suit) - 4):
        if suit_checker(cards_suit[i:i + 5]):
            if cards_suit[i + 4][0] > max_suit:
                max_suit = cards_suit[i + 4][0]
                max_suitidx = i
    if max_suit >= 0:
        return 'Flush', max_suit, cards_suit[max_suitidx + 3][0], cards_suit[max_suitidx + 2][0], \
               cards_suit[max_suitidx + 1][0], cards_suit[max_suitidx][0]

    for i in range(12, 3, -1):
        if card_count[i] > 0 and card_count[i - 1] > 0 and card_count[i - 2] > 0 and card_count[i - 3] > 0 \
                and card_count[i - 4] > 0:
            return 'Straight', i, 0, 0, 0, 0
    if card_count[12] > 0 and card_count[0] > 0 and card_count[1] > 0 and card_count[2] > 0 \
            and card_count[3] > 0:
        return 'Straight', 3, 0, 0, 0, 0

    first_three = -1
    remain = []
    for i in range(len(cards_value) - 1, -1, -1):
        if card_count[cards_value[i][0]] >= 3:
            # can't have two three-kinds, otherwise there will be full-house
            # only possible is 3, 1, 1, ...
            if first_three == -1:
                first_three = cards_value[i][0]
                continue
        elif card_count[cards_value[i][0]] > 0:
            if len(remain) < 2:
                remain.append(cards_value[i][0])
    if first_three != -1:
        return 'Three of a kind', first_three, remain[0], remain[1], 0, 0

    first_pair = -1
    second_pair = -1
    single_large = -1
    for i in range(len(cards_value) - 1, -1, -1):
        if card_count[cards_value[i][0]] >= 2:
            if first_pair == -1:
                first_pair = cards_value[i][0]
                continue
            # no four of a kind or three of a kind
            if first_pair != -1 and first_pair != cards_value[i][0] and second_pair == -1:
                second_pair = cards_value[i][0]
                continue
            if first_pair != cards_value[i][0] and second_pair != cards_value[i][0] and single_large == -1:
                single_large = cards_value[i][0]
        elif card_count[cards_value[i][0]] > 0:
            if single_large == -1:
                single_large = cards_value[i][0]
    if first_pair != -1 and second_pair != -1:
        return 'Two pairs', first_pair, second_pair, single_large, 0, 0
    ### Pair
    first_pair = -1
    remain = []
    for i in range(len(cards_value) - 1, -1, -1):
        # at most 2, and don't exist 2 pairs
        if card_count[cards_value[i][0]] >= 2:
            if first_pair == -1:
                first_pair = cards_value[i][0]
        elif card_count[cards_value[i][0]] > 0:
            if len(remain) < 3:
                remain.append(cards_value[i][0])
    if first_pair != -1:
        return 'Pair', first_pair, remain[0], remain[1], remain[2], 0
    remain = []
    for j in range(len(cards_value) - 1, -1, -1):
        if card_count[cards_value[j][0]] > 0:
            remain.append(cards_value[j][0])
            card_count[cards_value[j][0]] -= 1
            if len(remain) == 5:
                break
    return 'Highcard', remain[0], remain[1], remain[2], remain[3], remain[4]


def best_hand_to_list(cards, revealed_cards):
    player_best_hand = list(best_hand(cards, revealed_cards))
    player_best_hand[0] = hand_rank[player_best_hand[0]]
    return player_best_hand


def hand_cmp(hand1, hand2):
    res = 0
    for i in range(len(hand1)):
        res = res * 13 + hand1[i] - hand2[i]
    return res


# this is for no revealed cards
table1 = np.zeros((5, 3, 2, 7, 7, 4))  # 2 for the same color or not
# this is for 3 revealed cards
table2 = np.zeros((5, 3, 10, 7, 7, 4))  # use best hand as an approximation, and chips bet ratio
# this is for 4 revealed cards
table3 = np.zeros((5, 3, 10, 7, 7, 4))  # use best hand as an approximation, and chips bet ratio
pids = []  # only record opponents
pid_toid = None


# action: fold, call, raise (determined by the minimum call amount)
# last entry is the last bet ratio
def opponent_model(history, handid, me, num_players):
    global table1, table2, table3
    # array determining NA, winning, drawing or losing for each player
    res_list = [0 for i in range(num_players - 1)]
    learn_list = []
    # learning from history
    # guess opponent cards
    for i in range(len(history) - 1, -1, -1):
        if history[i]['type'] == 'win':
            break
    # print(history[last_h]['commonCards'])
    last_h = i
    win = False
    # determining winning, drawing
    for player in history[last_h]['winners']:
        if player['id'] == me:
            # im winning
            win = True
            break
    if win:
        # mark others as losers
        res_list = [3 for i in range(num_players - 1)]
        for player in history[last_h]['winners']:
            if player['id'] != me:
                res_list[pid_toid[player['id']]] = 2
        learn_list = list(range(num_players - 1))
    else:
        for player in history[last_h]['winners']:
            res_list[pid_toid[player['id']]] = 1
            learn_list.append(pid_toid[player['id']])
    # obtain learning resources from history
    for i in range(last_h, -1, -1):
        if history[i]['handId'] != handid:
            break
    if history[i]['handId'] != handid:
        i += 1
    start_h = i
    # my cards
    cards = []
    for player in history[last_h]['players']:
        if player['id'] == me:
            cards = card_preprocess(player['cards'])
    final_cards = card_preprocess(list(history[last_h]['commonCards']))
    my_best_hand = best_hand_to_list(cards, final_cards)

    for playerid in learn_list:
        # from start, obtain all common cards, betRatio
        common_cards = []
        bet_ratio = []
        amount = []
        bets = []
        folded = False
        for i in range(start_h, last_h + 1):
            if 'playerId' not in history[i]:
                continue
            if history[i]['playerId'] != pids[playerid]:
                continue
            common_cards.append(card_preprocess(history[i]['commonCards']))
            for player in history[i]['players']:
                if player['id'] == pids[playerid]:
                    ratio = history[i]['players']['chipsBet'] / (
                                history[i]['players']['chipsBet'] + history[i]['players']['chips'])
                    bet_ratio.append(ratio)
                    amount.append(history[i]['amount'])
                    bets.append(history[i]['players']['chipsBet'])
                    if player['status'] != 'active':
                        folded = True
                    break
            if folded:
                break
        past_ratio = [0.] + bet_ratio[:-1]
        for i in range(len(past_ratio)):
            if past_ratio[i] < 0.25:
                past_ratio[i] = 0
            elif past_ratio[i] < 0.5:
                past_ratio[i] = 1
            elif past_ratio[i] < 0.75:
                past_ratio[i] = 2
            else:
                past_ratio[i] = 3
        full_bets = [0] + bets
        bets = [bets[i + 1] - bets[i] for i in range(len(bets) - 1)]
        actions = []
        for i in range(len(bets)):
            if bets[i] > amount[i]:
                # raise
                actions.append(2)
            else:
                actions.append(1)
        if folded:
            # take out last action, replace by fold
            actions = actions[:-1] + [0]
        # using all information to train
        # first obtain all possible hand cards
        player_cards = []
        all_cards = []
        card_count = np.zeros((13, 4)).astype(int)
        for card in cards:
            card_count[card[0], card[1]] += 1
        for card in final_cards:
            card_count[card[0], card[1]] += 1
        for i in range(13):
            for j in range(4):
                if card_count[i, j] == 0:
                    all_cards.append([i, j])
        possible_cards = []
        for card1_i in range(len(all_cards)):
            for card2_i in range(card1_i + 1, len(all_cards)):
                p_cards = [all_cards[card1_i], all_cards[card2_i]]
                player_best_hand = best_hand_to_list(p_cards, final_cards)
                cmp_res = hand_cmp(player_best_hand, my_best_hand)
                if (cmp_res < 0 and res_list[playerid] == 3) \
                        or (cmp_res == 0 and res_list[playerid] == 2) \
                        or (cmp_res > 0 and res_list[playerid] == 1):
                    possible_cards.append(p_cards)
        # for all possible cards, update
        max_num = len(possible_cards)
        for i in range(len(possible_cards)):
            for t in range(len(common_cards)):
                if len(common_cards[i] == 0):
                    # 2 card senario
                    same_color = 0
                    if possible_cards[i][0][1] == possible_cards[i][1][1]:
                        same_color = 1
                    table1[
                        playerid, actions[i], same_color, possible_cards[i][0][0] // 2, possible_cards[i][0][1] // 2, \
                        past_ratio[i]] += 1 / max_num
                elif len(common_cards[i] == 3):
                    # 5 card scenario
                    player_best_hand = best_hand_to_list(possible_cards[i], common_cards[i])
                    table2[playerid, actions[i], player_best_hand[0], player_best_hand[1] // 2, \
                           player_best_hand[2] // 2, past_ratio[i]] += 1 / max_num
                else:
                    # 6 card scenario
                    player_best_hand = best_hand_to_list(possible_cards[i], common_cards[i])
                    table3[playerid, actions[i], player_best_hand[0], player_best_hand[1] // 2, \
                           player_best_hand[2] // 2, past_ratio[i]] += 1 / max_num


def win_lose_prob(cards, revealed_cards, actions, past_ratios, num_players):
    # given the cards and revealed cards, decide the win and lose prob by random sampling
    global table1, table2, table3
    # SAMPLE_NUM = 7000
    SAMPLE_NUM = 2500
    max_reveal_cards = 5
    fail = 0
    suc = 0
    draw = 0
    card_count = np.zeros((13, 4)).astype(int)
    for card in cards:
        card_count[card[0], card[1]] += 1
    for card in revealed_cards:
        card_count[card[0], card[1]] += 1
    all_cards = []
    for i in range(13):
        for j in range(4):
            if card_count[i, j] == 0:
                all_cards.append([i, j])
    me_first = False
    if len(actions) == 0:
        me_first = True
    norm_p = 0.
    for t in range(SAMPLE_NUM):
        new_revealed_cards = list(revealed_cards)
        add_reveal_cards = max_reveal_cards - len(new_revealed_cards)
        sampledidx = np.random.choice(len(all_cards), add_reveal_cards + 2 * (num_players - 1), replace=False)
        # randomly sample remaining revealed cards
        for i in range(max_reveal_cards - len(new_revealed_cards)):
            new_revealed_cards.append(all_cards[sampledidx[i]])
        player_cards = []
        player_best_hands = []
        for i in range(num_players - 1):
            player_cards.append([all_cards[sampledidx[add_reveal_cards + i * 2]],
                                 all_cards[sampledidx[add_reveal_cards + i * 2 + 1]]])
        # obtain best cards for each player
        for i in range(num_players - 1):
            # print(best_hand(player_cards[i], new_revealed_cards))
            player_best_hand = best_hand_to_list(player_cards[i], new_revealed_cards)
            player_best_hands.append(player_best_hand)
        player_best_hand = best_hand_to_list(cards, new_revealed_cards)
        my_best_hand = player_best_hand
        player_best_hands.sort(key=functools.cmp_to_key(hand_cmp))
        res = hand_cmp(my_best_hand, player_best_hands[-1])

        if me_first:
            if res < 0:
                fail += 1
            if res == 0:
                draw += 1
            if res > 0:
                suc += 1
            continue
        #### bayes rule for computing P(op C|common C, op A)
        # need info: id, current best hand, two cards, past_ratio
        prob = 1.
        if len(revealed_cards) == 0:
            for i in range(num_players - 1):
                if actions[i] != -1:
                    if player_cards[i][0][1] == player_cards[i][1][1]:
                        same_color = 1
                    else:
                        same_color = 0
                    p = table1[i, actions[i], same_color, \
                               player_cards[i][0][0] // 2, player_cards[i][1][0] // 2, past_ratios[i]] + 1e-1
                    prob *= p
        elif len(revealed_cards) == 3:
            for i in range(num_players - 1):
                if actions[i] != -1:
                    player_best_hand = best_hand_to_list(player_cards[i], revealed_cards)

                    p = table2[i, actions[i], player_best_hand[0], player_best_hand[1] // 2, \
                               player_best_hand[2] // 2, past_ratios[i]] + 1e-1
                    # print(p.shape)
                    prob *= p
        else:
            for i in range(num_players - 1):
                if actions[i] != -1:
                    player_best_hand = best_hand_to_list(player_cards[i], revealed_cards)
                    p = table3[i, actions[i], player_best_hand[0], player_best_hand[1] // 2, \
                               player_best_hand[2] // 2, past_ratios[i]] + 1e-1

                    # print(p.shape)
                    prob *= p

        norm_p += prob
        if res < 0:
            fail += prob
        if res == 0:
            draw += prob
        if res > 0:
            suc += prob
    if norm_p != 0.:
        fail = fail / norm_p
        suc = suc / norm_p
        draw = draw / norm_p
    total = fail + draw + suc

    return fail / total, draw / total, suc / total


hist_thre = [[] for i in range(7)]
hist_p = [[] for i in range(7)]

hist_thre[4] = [0.1464, 0.17152, 0.19664, 0.22176, 0.24688, 0.272, 0.29712,
                0.32224, 0.34736, 0.37248, 0.3976, 0.42272, 0.44784, 0.47296,
                0.49808, 0.5232, 0.54832, 0.57344, 0.59856, 0.62368, 0.6488]
hist_p[4] = [1.0, 0.8571428571428571, 0.5726495726495726, 0.3137973137973138, \
             0.12454212454212454, 0.04395604395604396, 0.018315018315018316, 0.01098901098901099, 0.007326007326007326,
             0.007326007326007326]
hist_thre[5] = [0.1464, 0.17152, 0.19664, 0.22176, 0.24688, 0.272, 0.29712,
                0.32224, 0.34736, 0.37248, 0.3976, 0.42272, 0.44784, 0.47296,
                0.49808, 0.5232, 0.54832, 0.57344, 0.59856, 0.62368, 0.6488]
hist_p[5] = [1.0, 0.8571428571428571, 0.5726495726495726, 0.3137973137973138, 0.12454212454212454, \
             0.04395604395604396, 0.018315018315018316, 0.01098901098901099, 0.007326007326007326, 0.007326007326007326]
hist_thre[6] = [0.0956, 0.11582, 0.13604, 0.15626, 0.17648, 0.1967, 0.21692,
                0.23714, 0.25736, 0.27758, 0.2978, 0.31802, 0.33824, 0.35846,
                0.37868, 0.3989, 0.41912, 0.43934, 0.45956, 0.47978, 0.5]
hist_p[6] = [1.0, 0.8363858363858364, 0.5128205128205128, 0.24664224664224665, 0.09157509157509157, \
             0.028083028083028084, 0.01098901098901099, 0.007326007326007326, 0.007326007326007326,
             0.003663003663003663]

actions = [-2, -2, -2, -2, -2, -2]
past_chips = [0, 0, 0, 0, 0, 0]
past_bets = [0, 0, 0, 0, 0, 0]
prev_common_cards = []  # record previous common cards in case it is empty


def potential(game_state):
    global actions, past_chips, past_bets, pids, pid_toid, prev_common_cards
    state = game_state['state']
    history = game_state['history']
    # first check if history contains win
    num_players = len(state['players'])
    me = state['players'][state['me']]['id']

    if pids == []:
        for player in state['players']:
            if player['id'] != me:
                pids.append(player['id'])
        # obtain pid to id
        pid_toid = {}
        for i in range(len(pids)):
            pid_toid[pids[i]] = i

    if actions[0] != -2:
        # can't right after initial
        for i in range(len(history) - 1, max(len(history) - num_players * 2 - 1, -1), -1):
            if history[i]['type'] == 'win':
                if len(history[i]['commonCards']) == 5 or len(prev_common_cards) == 5:
                    # start learning
                    # print('learning...')
                    if len(history[i]['commonCards']) != 5:
                        history[i]['commonCards'] = prev_common_cards
                    opponent_model(history, state['hand'], me, num_players)
                actions = [-2, -2, -2, -2, -2, -2]
                past_chips = [0, 0, 0, 0, 0, 0]
                past_bets = [0, 0, 0, 0, 0, 0]
                break

    past_ratios = [0, 0, 0, 0, 0, 0]
    if actions[0] == -2:
        # record chips and bets
        for player in state['players']:
            if player['id'] != me:
                past_chips[pid_toid[player['id']]] = player['chips']
                past_bets[pid_toid[player['id']]] = player['chipsBet']
                if player['status'] == 'folded':
                    actions[pid_toid[player['id']]] = 0
                else:
                    actions[pid_toid[player['id']]] = 1
                past_ratios = [0, 0, 0, 0, 0, 0]
    else:
        # trace back to set action
        for player in state['players']:
            if player['id'] != me:
                amount = state['callAmount']
                if actions[pid_toid[player['id']]] == -1:
                    continue
                if player['status'] == 'folded':
                    if actions[pid_toid[player['id']]] == 0:
                        actions[pid_toid[player['id']]] = -1
                        continue
                for i in range(len(history) - 1, -1, -1):
                    if 'playerId' not in history[i] or 'amount' not in history[i]:
                        continue
                    if history[i]['playerId'] == player['id']:
                        amount = history[i]['amount']
                        break
                betted = player['chipsBet'] - past_bets[pid_toid[player['id']]] - amount
                if betted > 0:
                    actions[pid_toid[player['id']]] = 2
                elif betted == 0:
                    actions[pid_toid[player['id']]] = 1
                if player['status'] == 'folded':
                    actions[pid_toid[player['id']]] = 0

                if player['chips'] + player['chipsBet'] != 0:
                    past_ratio = player['chipsBet'] / (player['chips'] + player['chipsBet'])
                else:
                    past_ratio = 0.
                if past_ratio < 0.25:
                    past_ratio = 0
                elif past_ratio < 0.5:
                    past_ratio = 1
                elif past_ratio < 0.75:
                    past_ratio = 2
                else:
                    past_ratio = 3
                past_ratios[pid_toid[player['id']]] = past_ratio
                past_chips[pid_toid[player['id']]] = player['chips']
                past_bets[pid_toid[player['id']]] = player['chipsBet']
    lose_rate, draw_rate, win_rate = win_lose_prob(card_preprocess(state['players'][state['me']]['cards']),
                                                   card_preprocess(state['commonCards']),
                                                   actions, past_ratios, num_players)
    prev_common_cards = state['commonCards']
    # print('lose rate:')
    # print(lose_rate)
    # print('draw rate:')
    # print(draw_rate)
    # print('win rate:')
    # print(win_rate)
    num_common_cards = len(state['commonCards'])
    # based on number of revealed cards, obtain the max winning rate
    high_threshold = 0.9  # ratio in the histogram
    low_threshold = 0.15
    if num_common_cards == 0:
        low_threshold = 0.0

    def transform_threshold(threshold, num_common_cards):
        if num_common_cards == 0:
            for i in range(len(hist_p[num_players])):
                if threshold <= 1 - hist_p[num_players][i]:
                    return hist_thre[num_players][i]
        elif num_common_cards == 3:
            return 0.7 * threshold
        else:
            return threshold

    high_threshold = transform_threshold(high_threshold, num_common_cards)
    low_threshold = transform_threshold(low_threshold, num_common_cards)
    # print('high threshold:')
    # print(high_threshold)
    # print('low threshold:')
    # print(low_threshold)
    if win_rate + draw_rate < low_threshold:
        # fold
        return 0
    if win_rate + draw_rate > high_threshold:
        # raise money
        high_raise_threshold = 0.3 * state['players'][state['me']]['chips']
        low_raise_threshold = state['minimumRaiseAmount']
        # linearly obtain
        raise_call = (high_raise_threshold - low_raise_threshold) / (1. - high_threshold)
        raise_call = raise_call * (win_rate + draw_rate - high_threshold) + low_raise_threshold
        if raise_call >= state['minimumRaiseAmount']:
            # print('raise call:')
            # print(raise_call)
            return raise_call
    # calling
    remain_chips = state['players'][state['me']]['chips'] - state['callAmount']
    buy_in_threshold = transform_threshold(0.1, num_common_cards)
    low_call_threshold = transform_threshold(0.8, num_common_cards)
    high_call_value = 2 * state['buyin']
    high_call_threshold = transform_threshold(0.05, num_common_cards)
    low_call_value = 0.1 * state['buyin']
    higher_call_value = 8 * state['buyin']
    higher_call_threshold = transform_threshold(0.0, num_common_cards)
    # interpolate between low and buy_in
    if remain_chips < low_call_value:
        threshold = low_call_threshold
    elif remain_chips <= state['buyin']:
        threshold = (buy_in_threshold - low_call_threshold) / (state['buyin'] - low_call_value)
        threshold = threshold * (remain_chips - low_call_value) + low_call_threshold
    elif remain_chips <= high_call_value:
        threshold = (high_call_threshold - buy_in_threshold) / (high_call_value - state['buyin'])
        threshold = threshold * (remain_chips - state['buyin']) + buy_in_threshold
    elif remain_chips <= higher_call_value:
        threshold = (higher_call_threshold - high_call_threshold) / (higher_call_value - high_call_value)
        threshold = threshold * (remain_chips - high_call_value) + high_call_threshold
    else:
        threshold = higher_call_threshold
    # print('threshold:')
    # print(threshold)
    if win_rate + draw_rate >= threshold:
        return state['callAmount']
    else:
        return 0
