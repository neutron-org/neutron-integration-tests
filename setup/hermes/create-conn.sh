#!/bin/bash
set -e

# Load shell variables
. ./network/hermes/variables.sh

### Configure the clients and connection
echo "Initiating connection handshake..."
while ! $HERMES_BINARY --config $CONFIG_DIR create connection --a-chain test-1 --b-chain test-2; do
  sleep 1
done

# a short living client is needed for client update proposal test
echo "Initiating short living client..."
while ! $HERMES_BINARY --config $CONFIG_DIR create client --trusting-period 5s --host-chain test-1 --reference-chain test-2; do
  sleep 1
done
# wait until the short living client expires
sleep 5
