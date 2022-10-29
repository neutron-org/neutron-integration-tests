#!/bin/bash

NEUTRON_BIN=/bin/neutrond
SEED="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"
ACCOUNT_NAME=test_demowallet

echo "Inititalizing test keyring"

echo -e "$SEED\n" | $NEUTRON_BIN keys add $ACCOUNT_NAME --recover

echo "test keyring initialized"

export RELAYER_NEUTRON_CHAIN_SIGN_KEY_NAME=$ACCOUNT_NAME
export RELAYER_NEUTRON_CHAIN_KEYRING_BACKEND=os
export RELAYER_NEUTRON_CHAIN_HOME_DIR=/root/.neutrond/

./run-old.sh || true

sleep infinity

