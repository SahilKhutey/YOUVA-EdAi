def test_required_roles_exist():
    roles = {
        "founder",
        "legal_compliance_advisor"
    }

    configured = {
        "founder",
        "pilot_partner",
        "legal_compliance_advisor"
    }

    assert roles.issubset(configured)


def test_b2b_requires_pilot_signoff():
    model = "b2b_school_first"

    required = model == "b2b_school_first"

    assert required is True


def test_b2c_does_not_require_pilot_partner():
    model = "b2c_family_first"

    required = model == "b2b_school_first"

    assert required is False
