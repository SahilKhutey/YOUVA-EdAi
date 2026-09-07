#!/usr/bin/env bash

set -euo pipefail

echo "========================================"
echo "YOUVA-EdAI P15 VERIFICATION"
echo "========================================"

node "$(dirname "$0")/verify-p15.js"

echo "P15 Verification complete."
