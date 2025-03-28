#!/bin/bash
set -e

BINARY=${BINARY:-neutrond}
BASE_DIR=./data
CHAINID=${CHAINID:-test-1}
CHAIN_DIR="$BASE_DIR/$CHAINID"

# Stop if it is already running
if pgrep -x "$BINARY" >/dev/null; then
    echo "Terminating $BINARY..."
    killall "$BINARY"
fi

echo "Removing previous data..."
rm -rf "$CHAIN_DIR" &> /dev/null

# Add directories for both chains, exit if an error occurs
if ! mkdir -p "$CHAIN_DIR" 2>/dev/null; then
    echo "Failed to create chain folder. Aborting..."
    exit 1
fi
