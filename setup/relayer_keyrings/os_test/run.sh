#!/bin/bash

NEUTRON_BIN=/bin/neutrond
KEYRING_PASS=rootroot
SEED="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"
ACCOUNT_NAME=os_demowallet

echo "Inititalizing os keyring"

echo -e "$SEED\n$KEYRING_PASS\n$KEYRING_PASS\n" | $NEUTRON_BIN keys add $ACCOUNT_NAME --recover

echo "os keyring initialized"

export RELAYER_KEYRING_KEY_NAME=$ACCOUNT_NAME
export RELAYER_KEYRING_BACKEND=os
export RELAYER_KEYRING_PASSWORD=$KEYRING_PASS
export RELAYER_NEUTRON_CHAIN_HOME_DIR=/root/.neutrond/

./run-old.sh
