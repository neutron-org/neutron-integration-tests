#!/bin/bash

BINARY=${BINARY:-neutrond}
CHAIN_DIR=./data
CHAINID=${CHAINID:-test-1}

VAL_MNEMONIC_1="clock post desk civil pottery foster expand merit dash seminar song memory figure uniform spice circle try happy obvious trash crime hybrid hood cushion"
VAL_MNEMONIC_2="angry twist harsh drastic left brass behave host shove marriage fall update business leg direct reward object ugly security warm tuna model broccoli choice"
DEMO_MNEMONIC_1="banner spread envelope side kite person disagree path silver will brother under couch edit food venture squirrel civil budget number acquire point work mass"
DEMO_MNEMONIC_2="veteran try aware erosion drink dance decade comic dawn museum release episode original list ability owner size tuition surface ceiling depth seminar capable only"
DEMO_MNEMONIC_3="obscure canal because tomorrow tribe sibling describe satoshi kiwi upgrade bless empty math trend erosion oblige donate label birth chronic hazard ensure wreck shine"
RLY_MNEMONIC_1="alley afraid soup fall idea toss can goose become valve initial strong forward bright dish figure check leopard decide warfare hub unusual join cart"
RLY_MNEMONIC_2="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"

STAKEDENOM=${STAKEDENOM:-stake}
ALLOW_ICA_EXEC=${ALLOW_ICA_EXEC:-no}

# Stop if it is already running 
if pgrep -x "$BINARY" >/dev/null; then
    echo "Terminating $BINARY..."
    killall $BINARY
fi

echo "Removing previous data..."
rm -rf $CHAIN_DIR/$CHAINID &> /dev/null

# Add directories for both chains, exit if an error occurs
if ! mkdir -p $CHAIN_DIR/$CHAINID 2>/dev/null; then
    echo "Failed to create chain folder. Aborting..."
    exit 1
fi

echo "Initializing $CHAINID..."
$BINARY init test --home $CHAIN_DIR/$CHAINID --chain-id=$CHAINID

echo "Adding genesis accounts..."
echo $VAL_MNEMONIC_1 | $BINARY keys add val1 --home $CHAIN_DIR/$CHAINID --recover --keyring-backend=test
echo $VAL_MNEMONIC_2 | $BINARY keys add val2 --home $CHAIN_DIR/$CHAINID --recover --keyring-backend=test
echo $DEMO_MNEMONIC_1 | $BINARY keys add demowallet1 --home $CHAIN_DIR/$CHAINID --recover --keyring-backend=test
echo $DEMO_MNEMONIC_2 | $BINARY keys add demowallet2 --home $CHAIN_DIR/$CHAINID --recover --keyring-backend=test
echo $DEMO_MNEMONIC_3 | $BINARY keys add demowallet3 --home $CHAIN_DIR/$CHAINID --recover --keyring-backend=test
echo $RLY_MNEMONIC_1 | $BINARY keys add rly1 --home $CHAIN_DIR/$CHAINID --recover --keyring-backend=test
echo $RLY_MNEMONIC_2 | $BINARY keys add rly2 --home $CHAIN_DIR/$CHAINID --recover --keyring-backend=test

$BINARY add-genesis-account $($BINARY --home $CHAIN_DIR/$CHAINID keys show val1 --keyring-backend test -a) 100000000000${STAKEDENOM}  --home $CHAIN_DIR/$CHAINID
$BINARY add-genesis-account $($BINARY --home $CHAIN_DIR/$CHAINID keys show val2 --keyring-backend test -a) 100000000000${STAKEDENOM}  --home $CHAIN_DIR/$CHAINID
$BINARY add-genesis-account $($BINARY --home $CHAIN_DIR/$CHAINID keys show demowallet1 --keyring-backend test -a) 100000000000${STAKEDENOM}  --home $CHAIN_DIR/$CHAINID
$BINARY add-genesis-account $($BINARY --home $CHAIN_DIR/$CHAINID keys show demowallet2 --keyring-backend test -a) 100000000000${STAKEDENOM}  --home $CHAIN_DIR/$CHAINID
$BINARY add-genesis-account $($BINARY --home $CHAIN_DIR/$CHAINID keys show demowallet3 --keyring-backend test -a) 100000000000${STAKEDENOM}  --home $CHAIN_DIR/$CHAINID
$BINARY add-genesis-account $($BINARY --home $CHAIN_DIR/$CHAINID keys show rly1 --keyring-backend test -a) 100000000000${STAKEDENOM}  --home $CHAIN_DIR/$CHAINID
$BINARY add-genesis-account $($BINARY --home $CHAIN_DIR/$CHAINID keys show rly2 --keyring-backend test -a) 100000000000${STAKEDENOM}  --home $CHAIN_DIR/$CHAINID

sed -i -e 's#"tcp://127.0.0.1:26657"#"tcp://0.0.0.0:26657"#g' $CHAIN_DIR/$CHAINID/config/config.toml
sed -i -e 's/timeout_commit = "5s"/timeout_commit = "1s"/g' $CHAIN_DIR/$CHAINID/config/config.toml
sed -i -e 's/timeout_propose = "3s"/timeout_propose = "1s"/g' $CHAIN_DIR/$CHAINID/config/config.toml
sed -i -e 's/index_all_keys = false/index_all_keys = true/g' $CHAIN_DIR/$CHAINID/config/config.toml
sed -i -e 's/enable = false/enable = true/g' $CHAIN_DIR/$CHAINID/config/app.toml
sed -i -e 's/swagger = false/swagger = true/g' $CHAIN_DIR/$CHAINID/config/app.toml
sed -i -e "s/minimum-gas-prices = \"\"/minimum-gas-prices = \"0.0025$STAKEDENOM\"/g" $CHAIN_DIR/$CHAINID/config/app.toml
sed -i -e 's/enabled = false/enabled = true/g' $CHAIN_DIR/$CHAINID/config/app.toml
sed -i -e 's/prometheus-retention-time = 0/prometheus-retention-time = 1000/g' $CHAIN_DIR/$CHAINID/config/app.toml

sed -i -e "s/\"denom\": \"stake\",/\"denom\": \"$STAKEDENOM\",/g" $CHAIN_DIR/$CHAINID/config/genesis.json
sed -i -e "s/\"mint_denom\": \"stake\",/\"mint_denom\": \"$STAKEDENOM\",/g" $CHAIN_DIR/$CHAINID/config/genesis.json
sed -i -e "s/\"bond_denom\": \"stake\"/\"bond_denom\": \"$STAKEDENOM\"/g" $CHAIN_DIR/$CHAINID/config/genesis.json


if [ "x$ALLOW_ICA_EXEC" = "xyes" ]; then
  # Update host chain genesis to allow x/bank/MsgSend ICA tx execution
  sed -i -e 's/\"allow_messages\":.*/\"allow_messages\": [\"\/cosmos.bank.v1beta1.MsgSend\", \"\/cosmos.staking.v1beta1.MsgDelegate\", \"\/cosmos.staking.v1beta1.MsgUndelegate\"]/g' $CHAIN_DIR/$CHAINID/config/genesis.json
fi;
