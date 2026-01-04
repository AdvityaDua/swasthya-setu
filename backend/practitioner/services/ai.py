def run_ai(test):
    if test.test_type == "TB":
        return {
            "risk_score": 0.82,
            "risk_level": "HIGH",
            "confidence": 0.91
        }
    return {
        "risk_score": 0.12,
        "risk_level": "LOW",
        "confidence": 0.95
    }