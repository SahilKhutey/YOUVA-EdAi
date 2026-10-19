import copy
import json

import pytest

from phase0.scripts.validate_scope_lock import (
    ValidationError,
    validate,
)


@pytest.fixture
def valid_scope():
    return {
        "document": {
            "name": "YOUVA EdAI MVP Scope Lock",
            "version": "1.0.0",
            "status": "locked",
            "dateLocked": "2026-09-08"
        },

        "launchTier": {
            "tier": "middle_school",
            "gradeBand": "Grade 7",
            "deferredTiers": [
                "kindergarten_junior",
                "high_school"
            ],
            "rationale": "Lowest-risk validated launch tier."
        },

        "jurisdiction": {
            "country": "India",
            "region": None,
            "regulation": "DPDP Act 2023",
            "reviewRequired": True,
            "reviewedBy": "Qualified Advisor",
            "reviewDate": "2026-09-08",
            "deferredJurisdictions": [
                "United States",
                "European Union"
            ]
        },

        "launchModel": {
            "model": "b2b_school_first",
            "pilotPartner": "Pilot School",
            "pilotRecruitmentPlan": None,
            "rationale": "Teacher oversight is central to the MVP thesis."
        },

        "mvpSubject": {
            "subject": "Mathematics",
            "grade": "Grade 7",
            "curriculumStandard": "CBSE",
            "units": [
                "Unit 1"
            ],
            "contentSourcingApproach": "build",
            "contentOwner": "Curriculum Lead",
            "estimatedTimelineWeeks": 8,
            "estimatedBudget": 100000
        },

        "outOfScope": [
            "billing",
            "skills_passport"
        ],

        "nextPhase": {
            "target": "phase_1",
            "requiresPhase0Gate": True
        }
    }


def test_valid_scope_passes(valid_scope):
    assert validate(valid_scope) is True


def test_missing_grade_fails(valid_scope):
    data = copy.deepcopy(valid_scope)
    data["launchTier"]["gradeBand"] = None

    with pytest.raises(ValidationError):
        validate(data)


def test_missing_jurisdiction_fails(valid_scope):
    data = copy.deepcopy(valid_scope)
    data["jurisdiction"]["country"] = None

    with pytest.raises(ValidationError):
        validate(data)


def test_missing_subject_fails(valid_scope):
    data = copy.deepcopy(valid_scope)
    data["mvpSubject"]["subject"] = None

    with pytest.raises(ValidationError):
        validate(data)


def test_empty_units_fails(valid_scope):
    data = copy.deepcopy(valid_scope)
    data["mvpSubject"]["units"] = []

    with pytest.raises(ValidationError):
        validate(data)


def test_b2b_requires_pilot_partner(valid_scope):
    data = copy.deepcopy(valid_scope)
    data["launchModel"]["pilotPartner"] = None

    with pytest.raises(ValidationError):
        validate(data)


def test_b2c_requires_recruitment_plan(valid_scope):
    data = copy.deepcopy(valid_scope)

    data["launchModel"]["model"] = "b2c_family_first"
    data["launchModel"]["pilotPartner"] = None
    data["launchModel"]["pilotRecruitmentPlan"] = None

    with pytest.raises(ValidationError):
        validate(data)
