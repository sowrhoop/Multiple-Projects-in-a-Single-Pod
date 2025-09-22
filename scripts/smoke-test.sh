#!/usr/bin/env bash
set -euo pipefail

BASE_A=${BASE_A:-http://localhost:8000}
BASE_B=${BASE_B:-http://localhost:3000}

echo "Checking ${BASE_A}/"
curl -fsS "${BASE_A}/" | jq . || curl -fsS "${BASE_A}/"

echo "Checking ${BASE_B}/"
curl -fsS "${BASE_B}/" | jq . || curl -fsS "${BASE_B}/"

echo "Smoke tests passed"

