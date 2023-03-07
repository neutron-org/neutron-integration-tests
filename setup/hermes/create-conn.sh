#!/bin/bash
set -e

# Load shell variables
. ./network/hermes/variables.sh

### Configure the clients and connection
echo "Initiating connection handshake..."
while ! $HERMES_BINARY --config $CONFIG_DIR create connection --a-chain test-1 --b-chain test-2; do
  sleep 1
done

sleep 2
