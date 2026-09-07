#!/usr/bin/env bash

set -euo pipefail

echo "========================================"
echo "YOUVA-EdAI P14 VERIFICATION"
echo "========================================"

node "$(dirname "$0")/verify-p14.js"

echo "P14 Verification complete."
