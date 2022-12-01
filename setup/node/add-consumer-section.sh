#!/bin/bash

BINARY=${BINARY:-neutrond}
CHAIN_DIR=./data
CHAINID=${CHAINID:-test-1}

echo "Add consumer section..."
$BINARY add-consumer-section --home $CHAIN_DIR/$CHAINID
