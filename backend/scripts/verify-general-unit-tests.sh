#!/usr/bin/env bash

set -euo pipefail

echo "================================================================"
echo " YOUVA GENERAL UNIT TEST SUITE VERIFICATION (UT-GEN-001 - UT-GEN-100)"
echo "================================================================"

node scripts/verify-general-unit-tests.js
