import random


class State:
    def __init__(self):
        self.buyin = 500
        self.call_amt = -1
        self.hand = -1
        self.me = -1
        self.min_raise_amt = -1
        self.pot = 0
        self.sb = 5
        self.common_cards = []
        self.players = []
        self.sidepots = []

        self.sb_ix = -1

    def to_dict(self):
        return {
            'state': {
                'buyin': self.buyin,
                'callAmount': self.call_amt,
                'hand': self.hand,
                'me': self.me,
                'minimumRaiseAmount': self.min_raise_amt,
                'pot': self.pot,
                'sb': self.sb,
                'commonCards': [
                    {'rank': c.rank, 'type': c.type}
                    for c in self.common_cards
                ],
                'players': [
                    {
                        'chips': pl.chips,
                        'chipsBet': pl.chips_bet,
                        'id': pl.id,
                        'name': pl.name,
                        'status': pl.status,
                        'cards': [
                            {'rank': c.rank, 'type': c.type}
                            for c in pl.cards
                        ]
                    }
                    for pl in self.players
                ],
                'sidepots': []
            },
            'history': {}
        }
        return


class Card:
    def __init__(self, rank='', type=''):
        self.rank = rank
        self.type = type

    def __str__(self):
        return f"{self.rank} of {self.type}"


class Player:
    def __init__(self, name, id):
        self.name = name
        self.id = id
        self.chips = -1
        self.chips_bet = 0
        self.status = ''
        self.cards = []


class Sidepot:
    def __init__(self, amount, quote):
        self.amount = amount
        self.quote = quote

    # int
    def amount(self):
        return self.amount

    # int
    def quote(self):
        return self.quote


class Deck:
    ranks = ('2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A')
    types = ('C', 'S', 'D', 'H')

    @staticmethod
    def random_card(self):
        id = random.randint(0, len(ranks) * len(types) - 1)
        return Card(
            Deck.ranks[id % len(Deck.ranks)],
            Deck.types[int(id / len(Deck.ranks))]
        )

    def __init__(self):
        self.cards = [i for i in range(len(Deck.ranks) * len(Deck.types))]
        random.shuffle(self.cards)

    def __str__(self):
        return str([str(self.id_to_card(id)) for id in self.cards])

    def card_toid(self, card):
        return Deck.types.index(card.type) * len(Deck.ranks) \
               + Deck.ranks.index(card.rank)

    def id_to_card(self, id):
        return Card(
            Deck.ranks[id % len(Deck.ranks)],
            Deck.types[int(id / len(Deck.ranks))]
        )

    def deal(self, count):
        assert len(self.cards) >= count, f"Cannot deal {count} cards. Only {len(self.cards)} left."
        out = self.cards[-count:]
        del self.cards[-count:]
        return [self.id_to_card(o) for o in out]

    def remove_card(self, card):
        self.cards.remove(self.card_toid(card))

    '''
    def remove_card(self, rank, type):
        self.remove_card(Card(rank, type))
    '''

    def pairs_gen(self):
        if len(self.cards) < 2:
            return
        all_pairs = []
        for i in range(len(self.cards) - 1):
            for j in range(i + 1, len(self.cards)):
                yield [self.id_to_card(self.cards[i]), self.id_to_card(self.cards[j])]


class Hit:
    order = ('straight-flush', 'bomb', 'fullhouse', 'flush', 'straight', 'set', 'two-pair', 'pair', 'highcard')

    def __init__(self, hit_type, rank):
        self.hit_type = hit_type
        self.rank = rank
        self.hit_ix = Hit.order.index(hit_type)
        self.rank_ix = Deck.ranks.index(rank)

    def __eq__(self, other):
        return (self.hit_ix == other.hit_ix) and (self.rank_ix == other.rank_ix)

    def __lt__(self, other):
        if self.hit_ix == other.hit_ix:
            return self.rank_ix < other.rank_ix
        return self.hit_ix > other.hit_ix


def _winner_ix(top_hits, default_ix):
    top_hit = top_hits[default_ix]
    ix = default_ix
    for i in range(len(top_hits)):
        if top_hit < top_hits[i]:
            top_hit = top_hits[i]
            ix = i
    return ix


def _top_hit(held, common):
    if len(held) == 0 and len(common) == 0:
        return Hit('highcard', '2')

    cards = held + common
    cards = sorted(cards, key=lambda c: Deck.ranks.index(c.rank), reverse=True)

    straight_flush = False
    for i in range(len(cards) - 4):
        rank = cards[i].rank
        type = cards[i].type
        jump = False
        for j in range(1, 5):
            if cards[i + j].type != type \
                    or Deck.ranks.index(cards[i + j].rank) != Deck.ranks.index(rank) + j:
                jump = True
                break
        if jump:
            continue
        straight_flush = True
        break
    if straight_flush:
        return Hit('straight-flush', rank)

    for i in range(len(cards) - 3):
        rank = cards[i].rank
        if cards[i + 1].rank != rank:
            continue
        if cards[i + 2].rank != rank:
            continue
        if cards[i + 3].rank != rank:
            continue
        return Hit('bomb', rank)

    sets = set()
    for i in range(len(cards) - 3):
        rank = cards[i].rank
        if cards[i + 1].rank != rank:
            continue
        if cards[i + 2].rank != rank:
            continue
        sets.add(rank)
    pairs = set()
    for i in range(len(cards) - 2):
        rank = cards[i].rank
        if cards[i + 1].rank != rank:
            continue
    if len(sets) > 0:
        a = pairs.difference(sets)
        if len(a) > 0:
            return Hit('fullhouse', max(list(sets) + list(a), key=lambda r: Deck.ranks.index(r)))

    C = list(filter(lambda c: c.type == 'C', cards))
    S = list(filter(lambda c: c.type == 'S', cards))
    D = list(filter(lambda c: c.type == 'D', cards))
    H = list(filter(lambda c: c.type == 'H', cards))
    for suit_cards in (C, S, D, H):
        if len(suit_cards) >= 5:
            return Hit('flush', max(suit_cards, key=lambda c: Deck.ranks.index(c.rank)).rank)

    straight = False
    for i in range(len(cards) - 4):
        rank = cards[i].rank
        type = cards[i].type
        jump = False
        for j in range(1, 5):
            if Deck.ranks.index(cards[i + j].rank) != Deck.ranks.index(rank) + j:
                jump = True
                break
        if jump:
            continue
        straight = True
        break
    if straight:
        return Hit('straight', rank)

    if len(sets) > 0:
        return Hit('set', max(sets, key=lambda r: Deck.ranks.index(r)))

    if len(pairs) >= 2:
        return Hit('two-pair', max(pairs, key=lambda r: Deck.ranks.index(r)))

    if len(pairs) == 1:
        return Hit('pair', max(pairs, key=lambda r: Deck.ranks.index(r)))

    return Hit('highcard', cards[0].rank)


def _split_hits(my_cards, common_cards):
    d = Deck()
    for card in common_cards:
        d.remove_card(card)
    for card in my_cards:
        d.remove_card(card)

    their_possible_top_hits = [_top_hit(their_cards, common_cards) for their_cards in d.pairs_gen()]

    board_top_hit = _top_hit([], common_cards)
    their_possible_top_hits = [hit for hit in their_possible_top_hits if board_top_hit < hit]

    my_top_hit = _top_hit(my_cards, common_cards)

    return my_top_hit, their_possible_top_hits


def _call(gs, my_player_dict):
    if gs['callAmount'] <= my_player_dict['chips']:
        return gs['callAmount']  # CALL
    return my_player_dict['chips']  # ALLIN


def _raise(gs, my_player_dict, mult):
    raise_amt = gs['minimumRaiseAmount'] - gs['callAmount']
    total_bet = int(mult * raise_amt) + gs['callAmount']
    if total_bet <= my_player_dict['chips']:
        return total_bet  # RAISE xMULT
    return my_player_dict['chips']  # ALLIN


def _play_pf_by_thresh(gs, my_player_dict, pf_thresh):
    rank_0 = my_player_dict['cards'][0]['rank']
    rank_1 = my_player_dict['cards'][1]['rank']

    pf = Deck.ranks.index(rank_0) + Deck.ranks.index(rank_1) + 2
    pocket = (rank_0 == rank_1)

    if pf < pf_thresh:
        return 0  # FOLD

    if pocket:
        raise_amt = gs['minimumRaiseAmount'] - gs['callAmount']
        total_bet = 3 * raise_amt + gs['callAmount']
        if total_bet <= my_player_dict['chips']:
            return total_bet  # RAISE x3

    return _call(gs, my_player_dict)  # CALL/ALLIN


def _has(hits, types):
    for type in types:
        if len(hits[type]) > 0:
            return True
    return False


def frame_0(game_state):
    return _call(game_state['state'], game_state['state']['players'][game_state['state']['me']])


def frame_1(game_state):
    gs = game_state['state']
    my_player_dict = gs['players'][gs['me']]

    my_cards = [Card(c['rank'], c['type']) for c in my_player_dict['cards']]
    common_cards = [Card(c['rank'], c['type']) for c in gs['commonCards']]

    if len(common_cards) == 0:
        return _play_pf_by_thresh(gs, my_player_dict, 17)

    top_hit = _top_hit(my_cards, common_cards)
    if Hit('highcard', 'A') < top_hit:
        return _call(gs, my_player_dict)  # CALL/ALLIN

    return 0  # FOLD


def frame_2(game_state):
    gs = game_state['state']
    my_player_dict = gs['players'][gs['me']]

    my_cards = [Card(c['rank'], c['type']) for c in my_player_dict['cards']]
    common_cards = [Card(c['rank'], c['type']) for c in gs['commonCards']]

    if len(common_cards) == 0:
        return _play_pf_by_thresh(gs, my_player_dict, 19)

    top_hit = _top_hit(my_cards, common_cards)
    if Hit('highcard', 'A') < top_hit:
        return _raise(gs, my_player_dict, 1)  # RAISE x1/ALLIN

    return 0  # FOLD


def meep(game_state):
    gs = game_state['state']
    my_player_dict = gs['players'][gs['me']]

    my_cards = [Card(c['rank'], c['type']) for c in my_player_dict['cards']]
    common_cards = [Card(c['rank'], c['type']) for c in gs['commonCards']]

    if len(common_cards) == 0:
        return _play_pf_by_thresh(gs, my_player_dict, 19)

    my_top_hit, their_possible_top_hits = _split_hits(my_cards, common_cards)

    our_wins = len(their_possible_top_hits) \
               - sum(list(map(lambda their_hit: my_top_hit < their_hit, their_possible_top_hits)))
    winrate = our_wins / len(their_possible_top_hits)

    if gs['callAmount'] > 0:
        if winrate > 0.6:
            return _raise(gs, my_player_dict, 1.3)
        if winrate > 0.5:
            return _call(gs, my_player_dict)
    if winrate > 0.6:
        return _raise(gs, my_player_dict, 1.5)
    if winrate > 0.5:
        return _raise(gs, my_player_dict, 1)
    return 0
