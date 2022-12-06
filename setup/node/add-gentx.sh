#!/bin/bash

BINARY=${BINARY:-neutrond}
CHAIN_DIR=./data
CHAINID=${CHAINID:-test-1}

STAKEDENOM=${STAKEDENOM:-stake}

echo "Creating and collecting gentx..."
$BINARY gentx val1 7000000000${STAKEDENOM} --home $CHAIN_DIR/$CHAINID --chain-id $CHAINID --keyring-backend test
$BINARY collect-gentxs --home $CHAIN_DIR/$CHAINID
