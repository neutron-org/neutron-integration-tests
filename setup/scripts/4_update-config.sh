#!/bin/bash
set -e

BASE_DIR=./data
CHAINID=${CHAINID:-test-1}
STAKEDENOM=${STAKEDENOM:-untrn}
CHAIN_DIR="$BASE_DIR/$CHAINID"

P2PPORT=${P2PPORT:-24656}
RPCPORT=${RPCPORT:-26657}
RESTPORT=${RESTPORT:-1317}
ROSETTA=${ROSETTA:-8081}
NODES=${NODES:-2}
PERSISTENT_PEER=${PERSISTENT_PEER:-127.0.0.1}

NODE1=$(neutrond --home ./data/test-1/node-1/ tendermint show-node-id)

for i in `seq 1 ${NODES}`; do
  sed -i -e 's/timeout_commit = "5s"/timeout_commit = "1s"/g' "${CHAIN_DIR}/node-${i}/config/config.toml"
  sed -i -e 's/timeout_propose = "3s"/timeout_propose = "1s"/g' "${CHAIN_DIR}/node-${i}/config/config.toml"
  sed -i -e 's/index_all_keys = false/index_all_keys = true/g' "${CHAIN_DIR}/node-${i}/config/config.toml"
  sed -i -e 's/enable = false/enable = true/g' "${CHAIN_DIR}/node-${i}/config/app.toml"
  sed -i -e 's/swagger = false/swagger = true/g' "${CHAIN_DIR}/node-${i}/config/app.toml"
  sed -i -e "s/minimum-gas-prices = \"\"/minimum-gas-prices = \"0.0025$STAKEDENOM,0.0025ibc\/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2\"/g" "${CHAIN_DIR}/node-${i}/config/app.toml"
  sed -i -e 's/enabled = false/enabled = true/g' "${CHAIN_DIR}/node-${i}/config/app.toml"
  sed -i -e 's/prometheus-retention-time = 0/prometheus-retention-time = 1000/g' "${CHAIN_DIR}/node-${i}/config/app.toml"

  if [ "$PERSISTENT_PEER" == "127.0.0.1" ]; then
    # That means, if we run all the nodes locally on the same machine,
    # we need to shift the ports occupied by a machine, to not conflict on them
    DELTA=i
  else
    DELTA=1
  fi;

  sed -i -e 's#"tcp://0.0.0.0:26656"#"tcp://0.0.0.0:'"$((P2PPORT + DELTA - 1))"'"#g' "${CHAIN_DIR}/node-${i}/config/config.toml"
  sed -i -e 's#"tcp://127.0.0.1:26657"#"tcp://0.0.0.0:'"$((RPCPORT + DELTA - 1))"'"#g' "${CHAIN_DIR}/node-${i}/config/config.toml"
  sed -i -e 's#"tcp://localhost:1317"#"tcp://0.0.0.0:'"$((RESTPORT + DELTA - 1))"'"#g' "${CHAIN_DIR}/node-${i}/config/app.toml"
  sed -i -e 's#"tcp://0.0.0.0:1317"#"tcp://0.0.0.0:'"$((RESTPORT + DELTA - 1))"'"#g' "${CHAIN_DIR}/node-${i}/config/app.toml"
  sed -i -e 's/enabled-unsafe-cors = false/enabled-unsafe-cors = true/g' "${CHAIN_DIR}/node-${i}/config/app.toml"
  sed -i -e 's/persistent_peers = ""/persistent_peers = "'"$NODE1@$PERSISTENT_PEER:$P2PPORT"'"/g' "${CHAIN_DIR}/node-${i}/config/config.toml"
  sed -i -e 's/allow_duplicate_ip = false/allow_duplicate_ip = true/g' "${CHAIN_DIR}/node-${i}/config/config.toml"
done;