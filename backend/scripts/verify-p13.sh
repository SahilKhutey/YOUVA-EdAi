#!/usr/bin/env bash

set -euo pipefail

echo "========================================"
echo "YOUVA-EdAI P13 VERIFICATION"
echo "========================================"

node "$(dirname "$0")/verify-p13.js"

echo "P13 Verification complete."
