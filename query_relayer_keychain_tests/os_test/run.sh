#!/bin/bash

NEUTRON_BIN=/bin/neutrond
KEYRING_PASS=rootroot
SEED="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"
ACCOUNT_NAME=os_demowallet

echo -e "$SEED\n$KEYRING_PASS\n$KEYRING_PASS\n" | $NEUTRON_BIN keys add $ACCOUNT_NAME --recover

RELAYER_NEUTRON_CHAIN_SIGN_KEY_NAME=$ACCOUNT_NAME
RELAYER_NEUTRON_CHAIN_KEYRING_BACKEND=os
RELAYER_NEUTRON_CHAIN_KEYRING_PASSWORD=123123

echo $RELAYER_NEUTRON_CHAIN_KEYRING_PASSWORD

# get this shit from original run.sh
NODE=${NODE:-node}
echo "Waiting for a first block..."
while ! curl -f ${NODE}:1317/blocks/1 >/dev/null 2>&1; do
  sleep 1
done
echo "Start relayer"

neutron_query_relayer || true

sleep infinity

