#!/bin/bash
set -e

# a short living client is needed for client update proposal test
echo "Initiating short living client..."
while ! hermes create client --trusting-period 5s --host-chain $HOST_CHAIN --reference-chain $REFERENCE_CHAIN; do
  sleep 1
done
# wait until the short living client expires
sleep 5
