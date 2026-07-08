"""
Challenge definitions for Risk Calculator
Based on original EntornoPrincipal structure with DNA Funded rules
"""

CHALLENGES = {
    "1 Phase": {
        "5000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "10000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "25000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "50000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "100000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "200000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6}
    },
    "2 Phase": {
        "5000": {"phase1_target": 8, "phase2_target": 5, "daily_loss": 5, "max_loss": 8},
        "10000": {"phase1_target": 8, "phase2_target": 5, "daily_loss": 5, "max_loss": 8},
        "25000": {"phase1_target": 8, "phase2_target": 5, "daily_loss": 5, "max_loss": 8},
        "50000": {"phase1_target": 8, "phase2_target": 5, "daily_loss": 5, "max_loss": 8},
        "100000": {"phase1_target": 8, "phase2_target": 5, "daily_loss": 5, "max_loss": 8},
        "200000": {"phase1_target": 8, "phase2_target": 5, "daily_loss": 5, "max_loss": 8}
    },
    "Rapid": {
        "5000": {"phase1_target": 5, "phase2_target": 0, "daily_loss": 3, "max_loss": 5},
        "10000": {"phase1_target": 5, "phase2_target": 0, "daily_loss": 3, "max_loss": 5},
        "25000": {"phase1_target": 5, "phase2_target": 0, "daily_loss": 3, "max_loss": 5},
        "50000": {"phase1_target": 5, "phase2_target": 0, "daily_loss": 3, "max_loss": 5},
        "100000": {"phase1_target": 5, "phase2_target": 0, "daily_loss": 3, "max_loss": 5},
        "200000": {"phase1_target": 5, "phase2_target": 0, "daily_loss": 3, "max_loss": 5}
    },
    "Instant Funding": {
        "5000": {"phase1_target": 0, "phase2_target": 0, "daily_loss": 0, "max_loss": 4},
        "10000": {"phase1_target": 0, "phase2_target": 0, "daily_loss": 0, "max_loss": 4},
        "25000": {"phase1_target": 0, "phase2_target": 0, "daily_loss": 0, "max_loss": 4},
        "50000": {"phase1_target": 0, "phase2_target": 0, "daily_loss": 0, "max_loss": 4},
        "100000": {"phase1_target": 0, "phase2_target": 0, "daily_loss": 0, "max_loss": 4},
        "200000": {"phase1_target": 0, "phase2_target": 0, "daily_loss": 0, "max_loss": 4}
    },
    "24 Hour": {
        "5000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "10000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "25000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "50000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "100000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6},
        "200000": {"phase1_target": 10, "phase2_target": 0, "daily_loss": 4, "max_loss": 6}
    }
}

def get_challenge(challenge_type):
    """Get challenge details by type"""
    return CHALLENGES.get(challenge_type)

def get_all_challenges():
    """Get all challenge types"""
    return list(CHALLENGES.keys())