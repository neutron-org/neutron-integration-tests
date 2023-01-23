#!/bin/bash
set -e

# Load shell variables
. ./network/hermes/variables.sh

echo "Waiting for a first neutron block..."
while ! curl -f http://neutron-node:1317/blocks/1 >/dev/null 2>&1; do
  sleep 1
done

echo "Waiting for a first gaia block..."
while ! curl -f http://gaia-node:1317/blocks/1 >/dev/null 2>&1; do
  sleep 1
done

### Configure the clients and connection
echo "Initiating connection handshake..."
$HERMES_BINARY --config $CONFIG_DIR create connection --a-chain test-1 --b-chain test-2

sleep 2
