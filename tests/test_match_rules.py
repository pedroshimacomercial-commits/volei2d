import unittest


def victory_condition(score_a, score_b):
    lead = abs(score_a - score_b)
    if score_a >= 5 and lead >= 2:
        return True
    if score_b >= 5 and lead >= 2:
        return True
    return False


def attack_power(charge, max_charge):
    if charge <= 0:
        return 0.0
    power = min(charge, 1.45)
    if charge > max_charge:
        power *= 0.7
    return max(0.2, power)


def defense_factor(stamina):
    return 0.7 if stamina > 0 else 0.3


class MatchRulesTest(unittest.TestCase):
    def test_standard_victory(self):
        self.assertTrue(victory_condition(5, 3))
        self.assertTrue(victory_condition(6, 4))
        self.assertTrue(victory_condition(7, 5))

    def test_advantage_rule(self):
        self.assertFalse(victory_condition(5, 4))
        self.assertFalse(victory_condition(4, 5))
        self.assertFalse(victory_condition(4, 4))

    def test_overcharge_penalty(self):
        self.assertAlmostEqual(attack_power(1.2, 1.35), 1.2)
        self.assertAlmostEqual(attack_power(1.5, 1.35), 1.015)

    def test_defense_without_stamina_reduces_effectiveness(self):
        self.assertAlmostEqual(defense_factor(25), 0.7)
        self.assertAlmostEqual(defense_factor(0), 0.3)


if __name__ == "__main__":
    unittest.main()
