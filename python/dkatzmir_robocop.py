'''
!!!!!
!!!!!
!!!!!
IMPORTANT PLEASE READ!!!!!!!!!!!!!!
!!!!!
!!!!!
!!!!!

When running our bot, pass in the game state to the method robocop(game_state)
all other code was created for implementation and testing

Created by:
  Kent Thai
  David Katz Mirkovich

'''

'''
  0. Royal flush
  1. Straight flush
  2. Four of a kind
  3. Full house
  4. Flush
  5. Straight
  6. Three of a kind
  7. Two pair
  8. Pair
  9. High Card
'''


def getRank(key):
    if (key.isnumeric()):
        return int(key)
    elif (key == "J"):
        return 11
    elif (key == "Q"):
        return 12
    elif (key == "K"):
        return 13
    elif (key == "A"):
        return 14
    return 0


class Deck():
    """Represents a deck of cards.

    Attributes:
      cards: 2D array: row = rank, col = suit
    """

    # Constructor
    def __init__(self):
        # 4x13 matrix representing cards in deck
        self.cards = [[1 for x in range(13)] for x in range(4)]
        self.numCards = 52
        self.hand = []
        self.suit_dict = {'S': 0, 'C': 1, 'D': 2, 'H': 3}
        self.rank_dict = {'2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10,
                          'K': 11, 'A': 12}

    # Print function
    def print(self):

        keys = ['S', 'C', 'D', 'H']
        vals = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

        # Print values on top ofmatrix
        print("   ", end='')
        for val in vals:
            if (val == '9'):
                print(val, end=' ')
                continue
            print(val, end='  ')
        print()

        i = 0
        for row in self.cards:
            print(keys[i] + ' ' + str(row))
            i += 1

    # Removes card from deck by setting val to 0, and adds card to hand
    def remove(self, rank, suit):
        row = self.suit_dict[suit]
        col = self.rank_dict[str(rank)]
        self.cards[row][col] = 0
        self.numCards -= 1
        self.hand.append([rank, suit])

    # gets current best hand from 'hand'
    def getBestHand(self):
        # Royal Flush
        # print(self.hand)

        for i in range(4):
            if (sum(self.cards[i][8:]) == 0):
                return 0, 0

        # Straight flush
        for j in range(12, 4, -1):
            for i in range(4):
                if ((sum(self.cards[i][j - 5:j], 0)) == 0):
                    return 1, 0

        # Four of a kind
        for j in range(13):
            colVector = []
            for row in range(4):
                colVector.append(self.cards[row][j])
            if (sum(colVector) == 0):
                return 2, 0

        # Full house
        hasPair = False
        pairRank = 0
        hasTriple = False
        for j in range(13):
            colVector = []
            for row in range(4):
                colVector.append(self.cards[row][j])
            if (sum(colVector) == 1):
                if (not hasTriple):
                    hasTriple = True
                elif (not hasPair):
                    hasPair = True
                    pairRank = j
                else:
                    break
            elif (sum(colVector) == 2):
                hasPair = True
                pairRank = j
            if (hasTriple and hasPair):
                return 3, 0

        # Flush
        for i in range(4):
            if (sum(self.cards[i]) <= 8):
                return 4, 0

        nums = []
        for c in self.hand:
            if (c[0] not in nums):
                nums.append(self.rank_dict[c[0]])

        nums.sort(reverse=True)

        # Straight
        for i in range(0, len(nums) - 4):
            if (nums[i:i + 5] == list(range(nums[i], nums[i] - 5, -1))):
                return 5, 0

        # Three of a kind
        if (hasTriple):
            return 6, 0

        # Two pair
        if (hasPair):
            for j in range(pairRank):
                colVector = []
                for row in range(4):
                    colVector.append(self.cards[row][j])
                if (sum(colVector) == 2):
                    return 7, 0

        # Pair
        if (hasPair):
            return 8, pairRank

        # High Card
        return 9, 0

    # returns the probability of getting the pokerHand specified in next two turns. Assumes that cards in hand have already been removed
    def probabilityOf(self, pokerHand):
        # Royal Flush
        if pokerHand == 0:

            # iterate rows (suit)
            for row in self.cards:

                # Get list of cards still in deck needed to complete hand
                cardsForHand = []
                for val in row[-5:]:
                    if val == 1:
                        cardsForHand.append(val)

                if len(self.hand) == 5:
                    # Already have it
                    if len(cardsForHand) == 0:
                        return 1.0
                    # Need 1 more card
                    elif len(cardsForHand) == 1:
                        return 1 / self.numCards + ((self.numCards - 4) / (self.numCards)) * (1 / (self.numCards - 1))
                    # Need 2 more cards
                    elif len(cardsForHand) == 2:
                        return ((1 / self.numCards) * (1 / (self.numCards - 1)))
                    # Impossible if need more than 2
                    elif len(cardsForHand) > 2:
                        continue

                if len(self.hand) == 6:
                    # Already have it
                    if len(cardsForHand) == 0:
                        return 1.0
                    # Need 1 more card
                    elif len(cardsForHand) == 1:
                        return 1 / self.numCards
                    # Impossible if need more than 1
                    elif len(cardsForHand) > 1:
                        continue

            # If checked each suit and needed more than 2 cards for all suits then it's impossible
            return 0.0

        # Straight flush
        elif pokerHand == 1:

            totalProb = 0.0

            # iterate rows (suit)
            for row in self.cards:

                # Iterate vals stopping at 5th to last since check 5 cards at a time
                for j in range(len(row) - 4):

                    # Get list of cards still in deck needed to complete hand
                    cardsForHand = []
                    for val in row[j:j + 5]:
                        if val == 1:
                            cardsForHand.append(val)

                    # Already have it
                    if len(cardsForHand) == 0:
                        return 1.0
                    # Need 1 more card
                    elif len(cardsForHand) == 1:
                        totalProb += 1 / self.numCards
                    # Need 2 more cards
                    elif len(cardsForHand) == 2:
                        totalProb += (1 / self.numCards) * (1 / (self.numCards - 1))
                    # Impossible if need more than 2
                    elif len(cardsForHand) > 2:
                        continue

            return totalProb

        # Four of a kind
        elif pokerHand == 2:

            numPair = 0
            numTriple = 0
            numQuad = 0

            # Iterate cols
            for col in range(13):

                # Create column vector
                colVector = []
                for row in range(4):
                    colVector.append(self.cards[row][col])

                # Found a quad
                if (sum(colVector) == 0):
                    return 1
                # Found a triple
                if (sum(colVector) == 1):
                    numTriple += 1
                # Found a double
                elif (sum(colVector) == 2):
                    numPair += 1

            if len(self.hand) == 5:

                # Found quad
                if (numQuad == 1):
                    return 1.0
                # 1 triple and no double
                elif (numTriple == 1 and numPair == 0):
                    return 2 / self.numCards
                # 1 triple and 1 double
                elif (numTriple == 1 and numPair == 1):
                    return 1 / self.numCards + ((2 / self.numCards) * (2 / (self.numCards - 1))) + (
                                ((self.numCards - 3) / self.numCards) * (1 / (self.numCards - 1)))
                # No triple and 1 double
                elif (numTriple == 0 and numPair == 1):
                    return (1 / self.numCards) * (1 / (self.numCards - 1))
                # No triple and 2 double
                elif (numTriple == 0 and numPair == 2):
                    return (4 / self.numCards) * (1 / (self.numCards - 1))
                # Not possible otherwise
                else:
                    return 0.0

            if len(self.hand) == 6:

                # Found quad
                if (numQuad == 1):
                    return 1.0
                # 2 triple no double
                elif (numTriple == 2 and numPair == 0):
                    return 2 / self.numCards
                # 1 triple no double
                elif (numTriple == 1 and numPair == 0):
                    return 1 / self.numCards
                # 1 triple 1 double
                elif (numTriple == 1 and numPair == 1):
                    return (1 / self.numCards) + (2 / self.numCards) * (2 / (self.numCards - 1)) + (
                                (self.numCards - 3) / self.numCards) * (1 / (self.numCards - 1))
                # Not possible otherwise
                else:
                    return 0

        # Full house
        elif pokerHand == 3:
            numPair = 0
            numTriple = 0

            # Iterate columns from end
            for j in range(13):

                # Create column vector
                colVector = []
                for row in range(4):
                    colVector.append(self.cards[row][j])

                # Found a triple
                if (sum(colVector) == 1):
                    numTriple += 1
                # Found a double
                elif (sum(colVector) == 2):
                    numPair += 1
            # Found full house
            if (numTriple > 0 and numPair > 0):
                return 1.0

            if len(self.hand) == 5:
                # Triple and 2 singles
                if (numTriple == 1 and numPair == 0):
                    # 3/numCards for one single + 3/numCards for other single + draw card other than the 11 * (3 for each single = 9)/(numCards-1)
                    return (6 / self.numCards) + ((1 / 41) * (9 / (self.numCards - 1)))
                # No triple and 2 doubles
                elif (numTriple == 0 and numPair == 2):
                    # 2/numCards for one double + 2/numCards for other double  => 4/numCards
                    # + 3/numCards for single * 2/(numCards-1) for single
                    # + 3/numCards for single * (2/numCards + 2/numCards) for either double
                    return 4 / self.numCards + (3 / self.numCards) * (6 / (self.numCards - 1)) + (
                                (self.numCards - 7) / self.numCards) * (4 / (self.numCards - 1))
                # no triple and 1 double
                elif (numTriple == 0 and numPair == 1):
                    return (2 / self.numCards) * (6 / (self.numCards - 1)) + (6 / self.numCards) * (
                                4 / self.numCards - 1)
                # not possible otherwise
                return 0

            if len(self.hand) == 6:
                # 1 Triple and no double
                if (numTriple == 1 and numPair == 0):
                    return 9 / self.numCards
                # No triple and 2 doubles
                elif (numTriple == 0 and numPair == 2):
                    return 4 / self.numCards
                # No triple and 3 doubles
                elif (numTriple == 0 and numPair == 3):
                    return 6 / self.numCards
                else:
                    return 0

        # Flush
        elif pokerHand == 4:

            totalProb = 0.0

            # iterate rows (suit)
            for row in self.cards:

                # Get list of cards still in deck needed to complete hand
                cardsForHand = []
                for val in row:
                    if val == 0:
                        cardsForHand.append(val)

                if (len(self.hand) == 5):
                    # Already have it
                    if len(cardsForHand) == 5:
                        return 1.0
                    # Need 1 more card
                    elif len(cardsForHand) == 4:
                        totalProb += 9 / self.numCards + ((self.numCards - 9) / self.numCards) * (
                                    9 / (self.numCards - 1))
                    # Need 2 more cards
                    elif len(cardsForHand) == 3:
                        totalProb += (10 / self.numCards) * (9 / (self.numCards - 1))
                    # Impossible if need more than 2
                    else:
                        continue
                else:
                    if len(cardsForHand) == 6:
                        return 1.0
                    elif len(cardsForHand) == 5:
                        return 1.0
                    # Need 1 more card
                    elif len(cardsForHand) == 4:
                        return (9 / self.numCards)
                    # Impossible if need more than 1
                    else:
                        continue

            return totalProb

        # Straight
        elif pokerHand == 5:

            totalProb = 0.0
            # collapse = 13*[0]
            collapse = []

            # Iterate cols
            for col in range(13):

                flag = False

                # If a col has 0 add to collapse
                for row in range(4):
                    if (self.cards[row][col] == 0):
                        # collapse.append(col)
                        flag = True
                        break

                if flag:
                    collapse.append(1)
                else:
                    collapse.append(0)

            if (len(self.hand) == 5):
                # iterate rows (suit) stopping at 5th to last
                for i in range(9):

                    # Already have it
                    if (sum(collapse[i:i + 5]) == 5):
                        return 1.0
                    # Need 1 more card
                    elif (sum(collapse[i:i + 5]) == 4):
                        totalProb += 1 / (13 - sum(collapse[i:i + 5]))
                    # Need 2 more cards
                    elif (sum(collapse[i:i + 5]) == 3):
                        totalProb += (1 / (13 - sum(collapse[i:i + 5]))) * (1 / (13 - sum(collapse[i:i + 5]) - 1))
                    # Impossible if need more than 2
                    else:
                        continue
            else:
                # iterate rows (suit) stopping at 5th to last
                for i in range(9):
                    # Already have it
                    if (sum(collapse[i:i + 5]) == 5):
                        return 1.0
                    # Need 1 more card
                    elif (sum(collapse[i:i + 5]) == 4):
                        totalProb += 1 / (13 - sum(collapse[i:i + 5]))
                    # Impossible if need more than 1
                    else:
                        continue

            return totalProb

        # Three of a kind
        elif pokerHand == 6:
            numPair = 0
            for j in range(13):
                colVector = []
                for row in range(4):
                    colVector.append(self.cards[row][j])
                if (sum(colVector) == 1):
                    return 1.0
                elif (sum(colVector) == 2):
                    numPair += 1

            if (len(self.hand) == 5):
                if (numPair == 2):
                    return 4 / self.numCards + (3 / self.numCards) * (6 / (self.numCards - 1)) + (
                                ((self.numCards - 7) / self.numCards) * (4 / (self.numCards - 1)))
                elif (numPair == 1):
                    return 2 / self.numCards + (6 / self.numCards) * (4 / (self.numCards - 1)) + (
                                ((self.numCards - 8) / self.numCards) * (2 / (self.numCards - 1)))
                else:
                    return 15 / self.numCards + 2 / (self.numCards - 1)
            else:
                if (numPair == 3):
                    return 6 / self.numCards
                elif (numPair == 2):
                    return 4 / self.numCards
                elif (numPair == 1):
                    return 2 / self.numCards
                else:
                    return 0

        # Two pair
        elif pokerHand == 7:

            hasPair = False

            # Iterate cols
            for j in range(13):

                # Get column
                colVector = []
                for row in range(4):
                    colVector.append(self.cards[row][j])

                # Found pair
                if (sum(colVector) <= 2):
                    if (hasPair):
                        return 1.0
                    else:
                        hasPair = True

            if len(self.hand) == 5:
                # 1 pair already
                if (hasPair):
                    return (9 / self.numCards) + (((self.numCards - 9) / self.numCards) * (12 / (self.numCards - 1)))
                else:
                    return (9 / self.numCards) + (((self.numCards - 9) / self.numCards) * (9 / (self.numCards - 1)))

            if len(self.hand) == 6:
                if (hasPair):
                    return 12 / self.numCards
                else:
                    return 0

        # Pair
        elif pokerHand == 8:
            for j in range(13):
                colVector = []
                for row in range(4):
                    colVector.append(self.cards[row][j])
                if (sum(colVector) <= 2):
                    return 1.0
            if (len(self.hand) == 5):
                return 15 / self.numCards + ((self.numCards - 15) / self.numCards) * (18 / (self.numCards - 1))
            else:
                return 18 / self.numCards

        # High Card
        elif pokerHand == 9:
            return 1.0


def robocop(game_state):
    gs = game_state['state']
    suites = {'S': [], 'C': [], 'D': [], 'H': []}
    values = [[], [], [], [], [], [], [], [], [], [], [], [], []]
    numVal = ""  # 13-char string representing # cards you have for each value
    suitVal = ""
    numCards = 0
    me = (gs['players'])[gs['me']]
    deck = Deck()

    chips = me['chips']
    callAmount = gs['callAmount']
    raise_amount = gs['minimumRaiseAmount']

    for c in me['cards']:
        suit = c['type']
        rank = c['rank']
        values[getRank(rank) - 2].append(suit)
        deck.remove(rank, suit)
        numCards += 1

    for c in gs['commonCards']:
        suit = c['type']
        rank = c['rank']
        values[getRank(rank) - 2].append(suit)
        deck.remove(rank, suit)
        numCards += 1

    # Fills in numVal
    for i in range(13):
        v = values[i]
        numVal += str(len(v))
        for s in v:
            suitVal += s

    if (numCards == 2):
        # When to play:
        # double, card values higher than 7, 2 cards of same suite
        # if we are big blind, then check. If someone raises, then fold

        maxSuite = 0
        # Calculate max suite
        for key, val in suites.items():
            if (len(val) > maxSuite):
                maxSuite = len(val)

        # Play if have double, high card, or two of same suite:
        if (('2' in numVal) or ('1' in numVal[6:]) or ((maxSuite == 2) and '1' in numVal[6:])):
            return callAmount
        # TODO: Determine if someone raised
        else:
            return 0

        # Implement raising if high double or something

    elif (numCards == 5):
        # Flop:
        # Find best current hand
        #   Better than pair
        # Calculate probabilites for potential hands
        # If greater then 50% prob and greater than pair
        # If we have a good hand (straight or better) and prob of 65% or better
        #   Raise a good amount

        bestHand, pairRank = deck.getBestHand()

        print("bestHand = ", bestHand)

        if bestHand <= 7:

            if bestHand < 3:
                return chips
            elif bestHand <= 3:
                return min(callAmount + (8 * raise_amount), chips)
            elif bestHand <= 4:
                return min(callAmount + (4 * raise_amount), chips)
            elif bestHand <= 5:
                return min(callAmount + (2 * raise_amount), chips)
            elif bestHand <= 6:
                return min(callAmount + raise_amount, chips)
            else:
                return 0

        # Otherwise, divide the porb of each hand by max prob and multiply by weight
        # Probabilities
        else:

            # Best case probabilities (other than 100% chance) of 4-of-kind, full-house, flush, straight, 3-of-kind, 2-pair, pair
            best_case_prob = [0.0434, 0.2044, 0.105, 0.514, 0.1933, 0.4024, 0.5856]

            # Weights of 4-of-kind, full-house, flush, straight, 3-of-kind, 2-pair, pair
            weights = [1620, 270, 200, 100, 20, 10, 1]

            # Get probabilities of each hand
            probabilities = [0] * 10
            for i in range(10):
                probabilities[i] = deck.probabilityOf(i)

            # Holds probability of each hand divided by corresponding best case prob multiplied by weight
            scaled_prob = []

            # Scale probabilities
            for i in range(7):
                # If 100% change just add weight
                if probabilities[i + 2] == 1.0:
                    scaled_prob.append(weights[i])
                # Divided prob by best-case prob and multiply by weight
                else:
                    scaled_prob.append((probabilities[i + 2] / best_case_prob[i]) * weights[i])

            score = sum(scaled_prob)

            print(score)

            # score better than 400: double raise
            if score >= 400:
                return min(callAmount + (2 * raise_amount), chips)
            # score better than 200: raise
            if score >= 200:
                return min(callAmount + raise_amount, chips)
            # score better than 100 AND atleast have a pair : call
            elif score >= 100 and bestHand <= 8:
                # play
                return min(callAmount, chips)
            # Fold if score < 100
            else:
                return 0





    # Calculate probabilites of get each hand and expected value of hand
    # Compared to threshold to determine whether to raise fold or call

    elif (numCards == 6):

        # If we have 100% chance of 2 pair or higher, than play (raise the better the hand)
        # If >= 2 pair: play 1x
        # if >= triple: play 2x
        # if >= flush: play 4x
        # ...
        # 4 of kind or better ALL IN!!

        bestHand, pairRank = deck.getBestHand()

        if bestHand <= 7:
            if bestHand < 3:
                return chips
            elif bestHand <= 3:
                return min(callAmount + (8 * raise_amount), chips)
            elif bestHand <= 4:
                return min(callAmount + (4 * raise_amount), chips)
            elif bestHand <= 5:
                return min(callAmount + (2 * raise_amount), chips)
            elif bestHand <= 6:
                return min(callAmount + raise_amount, chips)
            else:
                return 0




        # Otherwise, divide the porb of each hand by max prob and multiply by weight

        else:
            # Best case probabilities (other than 100% chance) of 4-of-kind, full-house, flush, straight, 3-of-kind, 2-pair, pair
            best_case_prob = [2 / 46, 9 / 46, 9 / 46, 2 / 13, 6 / 46, 12 / 46, 18 / 46]

            # Weights of 4-of-kind, full-house, flush, straight, 3-of-kind, 2-pair, pair
            weights = [1620, 270, 200, 100, 20, 10, 1]

            # Get probabilities of each hand
            probabilities = [0] * 10
            for i in range(10):
                probabilities[i] = deck.probabilityOf(i)

            # Holds probability of each hand divided by corresponding best case prob multiplied by weight
            scaled_prob = []

            for i in range(7):

                # If 100% change just add weight
                if probabilities[i + 2] == 1.0:
                    scaled_prob.append(weights[i])
                # Divided prob by best-case prob and multiply by weight
                else:
                    scaled_prob.append((probabilities[i + 2] / best_case_prob[i]) * weights[i])

            score = sum(scaled_prob)

            # score better than 400: double raise
            if score >= 400:
                return min(callAmount + (2 * raise_amount), chips)
            # score better than 200: raise
            if score >= 200:
                return min(callAmount + raise_amount, chips)
            # score better than 100 AND atleast have a pair : call
            elif score >= 100 and bestHand <= 8:
                # play
                return min(callAmount, chips)
            # Fold if score < 100
            else:
                return 0

    else:
        # We know our best hand possible here
        # Raise up to a certain amount based on how good best hand is
        bestHand, pairRank = deck.getBestHand()

        print(bestHand, callAmount, raise_amount, chips)
        print(min(callAmount + raise_amount, chips))

        if bestHand < 3:
            return chips
        elif bestHand <= 3:
            return min(callAmount + (8 * raise_amount), chips)
        elif bestHand <= 4:
            return min(callAmount + (4 * raise_amount), chips)
        elif bestHand <= 5:
            return min(callAmount + (2 * raise_amount), chips)
        elif bestHand <= 6:
            return min(callAmount + raise_amount, chips)
        else:
            return 0

    return 0


def selfTest():
    test_probablityOf()
    # test_getBestHand()


# Test getBestHand()
def test_getBestHand():
    print("\nTesting getBestHand function!\n")

    deck = Deck()

    # Set up hand
    # Royal Flush 0
    deck.remove('A', 'H')
    deck.remove('K', 'H')
    deck.remove('Q', 'H')
    deck.remove('J', 'H')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    deck = Deck()

    # Straight Flush 1
    deck.remove('9', 'H')
    deck.remove('K', 'H')
    deck.remove('Q', 'H')
    deck.remove('J', 'H')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    deck = Deck()

    # 4 of a kind 2
    deck.remove('A', 'H')
    deck.remove('A', 'C')
    deck.remove('A', 'D')
    deck.remove('A', 'S')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    # Full House 3
    deck = Deck()
    deck.remove('A', 'H')
    deck.remove('A', 'C')
    deck.remove('A', 'D')
    deck.remove('10', 'S')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    # Flush 4
    deck = Deck()
    deck.remove('A', 'H')
    deck.remove('K', 'H')
    deck.remove('2', 'H')
    deck.remove('J', 'H')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    # Straight 5
    deck = Deck()
    deck.remove('A', 'S')
    deck.remove('K', 'H')
    deck.remove('Q', 'H')
    deck.remove('J', 'H')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    # Three of a Kind 6
    deck = Deck()
    deck.remove('A', 'H')
    deck.remove('A', 'D')
    deck.remove('A', 'S')
    deck.remove('J', 'H')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    # Two Pair 7
    deck = Deck()
    deck.remove('A', 'H')
    deck.remove('A', 'D')
    deck.remove('10', 'S')
    deck.remove('J', 'H')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    # Pair 8
    deck = Deck()
    deck.remove('A', 'H')
    deck.remove('A', 'D')
    deck.remove('3', 'S')
    deck.remove('J', 'D')
    deck.remove('10', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)

    # High Card 9
    deck = Deck()
    deck.remove('A', 'H')
    deck.remove('3', 'D')
    deck.remove('2', 'S')
    deck.remove('J', 'H')
    deck.remove('5', 'H')

    bestHand, pairRank = deck.getBestHand()
    print(bestHand)


# Test probability function
def test_probablityOf():
    print("\nTesting probability function!\n")

    deck = Deck()

    probabilities = [0] * 10

    # Set up hand
    '''
    deck.remove('K', 'H')
    deck.remove('Q', 'H')
    deck.remove('J', 'H')
    deck.remove('10', 'H')
    deck.remove('J', 'D')
    '''
    deck.remove('K', 'H')
    deck.remove('K', 'D')
    deck.remove('J', 'H')
    deck.remove('J', 'D')
    deck.remove('10', 'H')
    deck.remove('10', 'S')

    deck.print()

    for i in range(10):
        probabilities[i] = deck.probabilityOf(i)

    hands = ['Royal flush', 'Strt flush', '4 of a kind', 'Full house', 'Flush', 'Straight', '3 of a kind', '2 pair',
             'Pair', 'High Card']

    for i, hand in enumerate(hands):
        # print("P({0}) \t= {1:.2%}".format(hand, probabilities[i]))
        print("P({0}) \t= {1}".format(hand, probabilities[i]))

    sum = 0
    for val in probabilities:
        sum += val
    print("Sum = " + str(sum))


test_state1 = {
    "state": {"tournamentId": "5c496c6116b7cb7c90b86c8-000", "buyin": 500, "game": 1, "hand": 1, "spinCount": 0,
              "sb": 5, "pot": 15, "sidepots": [], "commonCards": [], "db": 0, "callAmount": 10,
              "minimumRaiseAmount": 20, "players": [
            {"id": "5c7b86475898d33c8000f05a", "name": "ariel", "status": "active", "chips": 500, "chipsBet": 0},
            {"id": "5c7b864c5898d33c8000f05b", "name": "bender", "status": "active", "chips": 495, "chipsBet": 5},
            {"id": "5c7b86525898d33c8000f05c", "name": "marvin", "status": "active", "chips": 490, "chipsBet": 10},
            {"id": "5c7b865a5898d33c8000f05d", "name": "r2d2", "status": "active", "chips": 500, "chipsBet": 0,
             "cards": [{"rank": "7", "type": "C"}, {"rank": "J", "type": "H"}]}], "me": 3}}
test_state2 = {
    "state": {"tournamentId": "5c496c6116b7cb7c90b86c8-000", "buyin": 500, "game": 1, "hand": 3, "spinCount": 0,
              "sb": 5, "pot": 115, "sidepots": [],
              "commonCards": [{"rank": "8", "type": "H"}, {"rank": "J", "type": "H"}, {"rank": "A", "type": "D"},
                              {"rank": "J", "type": "D"}, {"rank": "J", "type": "S"}], "db": 2, "callAmount": 0,
              "minimumRaiseAmount": 40, "players": [
            {"id": "5c7b86475898d33c8000f05a", "name": "ariel", "status": "folded", "chips": 490, "chipsBet": 10},
            {"id": "5c7b864c5898d33c8000f05b", "name": "bender", "status": "active", "chips": 275, "chipsBet": 35},
            {"id": "5c7b86525898d33c8000f05c", "name": "marvin", "status": "active", "chips": 545, "chipsBet": 35},
            {"id": "5c7b865a5898d33c8000f05d", "name": "r2d2", "status": "active", "chips": 575, "chipsBet": 35,
             "cards": [{"rank": "2", "type": "H"}, {"rank": "9", "type": "H"}]}], "me": 3}}
print(robocop(test_state2))

cards = [
    {'rank': '9', 'type': 'D'},
    {'rank': '2', 'type': 'H'},
    {'rank': '11', 'type': 'S'}
]

# Run tests
# selfTest()
