#!/bin/bash

# Quick API Tests Runner
# Runs only API tests

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/run-tests.sh" api

