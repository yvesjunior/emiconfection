#!/bin/bash

# Quick Mobile Tests Runner
# Runs only Mobile tests

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/run-tests.sh" mobile

