#!/bin/bash
set -e

BINARY=${BINARY:-neutrond}
BASE_DIR=./data
CHAINID=${CHAINID:-test-1}
STAKEDENOM=${STAKEDENOM:-untrn}
IBCATOMDENOM=${IBCATOMDENOM:-uibcatom}
IBCUSDCDENOM=${IBCUSDCDENOM:-uibcusdc}
CHAIN_DIR="$BASE_DIR/$CHAINID"

NODES=${NODES:-2}


VAL_MNEMONIC_1="clock post desk civil pottery foster expand merit dash seminar song memory figure uniform spice circle try happy obvious trash crime hybrid hood cushion"
VAL_MNEMONIC_2="angry twist harsh drastic left brass behave host shove marriage fall update business leg direct reward object ugly security warm tuna model broccoli choice"
DEMO_MNEMONIC_1="banner spread envelope side kite person disagree path silver will brother under couch edit food venture squirrel civil budget number acquire point work mass"
DEMO_MNEMONIC_2="veteran try aware erosion drink dance decade comic dawn museum release episode original list ability owner size tuition surface ceiling depth seminar capable only"
DEMO_MNEMONIC_3="obscure canal because tomorrow tribe sibling describe satoshi kiwi upgrade bless empty math trend erosion oblige donate label birth chronic hazard ensure wreck shine"
RLY_MNEMONIC_1="alley afraid soup fall idea toss can goose become valve initial strong forward bright dish figure check leopard decide warfare hub unusual join cart"
RLY_MNEMONIC_2="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"


MASTER_CHAIN_DIR="${CHAIN_DIR}/node-1"

$BINARY init test-1 --home "${MASTER_CHAIN_DIR}" --chain-id="$CHAINID"

echo "Adding genesis accounts..."
echo "$VAL_MNEMONIC_1" | $BINARY keys add val1 --home "$MASTER_CHAIN_DIR" --recover --keyring-backend=test
echo "$VAL_MNEMONIC_2" | $BINARY keys add val2 --home "$MASTER_CHAIN_DIR" --recover --keyring-backend=test
echo "$DEMO_MNEMONIC_1" | $BINARY keys add demowallet1 --home "$MASTER_CHAIN_DIR" --recover --keyring-backend=test
echo "$DEMO_MNEMONIC_2" | $BINARY keys add demowallet2 --home "$MASTER_CHAIN_DIR" --recover --keyring-backend=test
echo "$DEMO_MNEMONIC_3" | $BINARY keys add demowallet3 --home "$MASTER_CHAIN_DIR" --recover --keyring-backend=test
echo "$RLY_MNEMONIC_1" | $BINARY keys add rly1 --home "$MASTER_CHAIN_DIR" --recover --keyring-backend=test
echo "$RLY_MNEMONIC_2" | $BINARY keys add rly2 --home "$MASTER_CHAIN_DIR" --recover --keyring-backend=test
$BINARY $GENESIS_PREFIX add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show val1 --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show val2 --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show demowallet1 --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM,100000000000000$IBCATOMDENOM,100000000000000$IBCUSDCDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show demowallet2 --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM,100000000000000$IBCATOMDENOM,100000000000000$IBCUSDCDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show demowallet3 --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM,100000000000000$IBCATOMDENOM,100000000000000$IBCUSDCDENOM"  --home "$MASTER_CHAIN_DIR"
# eth like demo1, demo2, demo3 accounts
$BINARY $GENESIS_PREFIX add-genesis-account neutron165cyjk6ujhjy3cyxkj2wdqw3fj3k69kqkaqnrm "100000000000000$STAKEDENOM,100000000000000$IBCATOMDENOM,100000000000000$IBCUSDCDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account neutron1lx5vlcwz78zp4g24qne4mrsutvkkh5ffj674q5 "100000000000000$STAKEDENOM,100000000000000$IBCATOMDENOM,100000000000000$IBCUSDCDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account neutron1m2arw2gnr5n3n0g2yg40y6qzj0lclw9jxuth9e "100000000000000$STAKEDENOM,100000000000000$IBCATOMDENOM,100000000000000$IBCUSDCDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show rly1 --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY $GENESIS_PREFIX add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show rly2 --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM"  --home "$MASTER_CHAIN_DIR"
$BINARY gentx val1 "100000000$STAKEDENOM" --home "$MASTER_CHAIN_DIR" --chain-id "$CHAINID" --keyring-backend test


echo "Initializing $CHAINID..."
for i in `seq 2 ${NODES}`; do
  $BINARY init test-${i} --home "${CHAIN_DIR}/node-${i}" --chain-id="$CHAINID"
  $BINARY add-genesis-account "$($BINARY --home "$MASTER_CHAIN_DIR" keys show val${i} --keyring-backend test -a --home "$MASTER_CHAIN_DIR")" "100000000000000$STAKEDENOM"  --home "${CHAIN_DIR}/node-${i}"
  $BINARY gentx val${i} "10000000$STAKEDENOM" --home "${CHAIN_DIR}/node-${i}" --chain-id "$CHAINID" --keyring-backend test --output-document "${MASTER_CHAIN_DIR}/config/gentx/gentx-val${i}.json" --keyring-dir "$MASTER_CHAIN_DIR"
done
$BINARY collect-gentxs --home "${CHAIN_DIR}/node-1"

GENESIS_FILE="$MASTER_CHAIN_DIR/config/genesis.json"

sed -i -e "s/\"denom\": \"stake\",/\"denom\": \"$STAKEDENOM\",/g" "$GENESIS_FILE"
sed -i -e "s/\"mint_denom\": \"stake\",/\"mint_denom\": \"$STAKEDENOM\",/g" "$GENESIS_FILE"
sed -i -e "s/\"bond_denom\": \"stake\"/\"bond_denom\": \"$STAKEDENOM\"/g" "$GENESIS_FILE"


