#!/bin/bash

NEUTRON_BIN=/bin/neutrond
SEED="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"
ACCOUNT_NAME=test_demowallet

echo "Inititalizing pass keyring"

gpg --batch --gen-key <<EOF
Key-Type: 1
Key-Length: 2048
Subkey-Type: 1
Subkey-Length: 2048
Name-Real: test-user
Name-Email: test@test.com
Expire-Date: 0
Passphrase: rootroot
EOF

pass init test-user

echo "pinentry-program /fake-pinentry.sh" > ~/.gnupg/gpg-agent.conf
gpg-connect-agent reloadagent /bye

echo -e "$SEED\n" | $NEUTRON_BIN keys add $ACCOUNT_NAME --recover --keyring-backend=pass --keyring-dir=/root/.neutrond/

echo "pass keyring initialized"

export RELAYER_NEUTRON_CHAIN_SIGN_KEY_NAME=$ACCOUNT_NAME
export RELAYER_NEUTRON_CHAIN_KEYRING_BACKEND=pass
export RELAYER_NEUTRON_CHAIN_HOME_DIR=/root/.neutrond/

./run-old.sh || true

sleep infinity
