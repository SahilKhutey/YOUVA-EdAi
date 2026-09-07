#!/usr/bin/env bash

set -euo pipefail

echo "========================================"
echo "YOUVA-EdAI P12 VERIFICATION"
echo "========================================"

node "$(dirname "$0")/verify-p12.js"

echo "P12 Verification complete."
