#!/bin/bash

BINARY=${BINARY:-neutrond}
CHAIN_DIR=./data
CHAINID=${CHAINID:-test-1}
STAKEDENOM=${STAKEDENOM:-stake}

ADMIN_ADDRESS=neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2
DAO_CONTRACT=/opt/neutron/contracts/dao/cwd_core.wasm
PRE_PROPOSAL_CONTRACT=/opt/neutron/contracts/dao/cwd_pre_propose_single.wasm
PROPOSAL_CONTRACT=/opt/neutron/contracts/dao/cwd_proposal_single.wasm
VOTING_REGISTRY_CONTRACT=/opt/neutron/contracts/dao/neutron_voting_registry.wasm
VAULT_CONTRACT=/opt/neutron/contracts/dao/neutron_vault.wasm
PROPOSAL_MULTIPLE_CONTRACT=/opt/neutron/contracts/dao/cwd_proposal_multiple.wasm
PRE_PROPOSAL_MULTIPLE_CONTRACT=/opt/neutron/contracts/dao/cwd_pre_propose_multiple.wasm
TREASURY_CONTRACT=/opt/neutron/contracts/dao/neutron_treasury.wasm

echo "Add consumer section..."
$BINARY add-consumer-section --home $CHAIN_DIR/$CHAINID

echo "Initializing dao contract in genesis..."
# Upload the dao contract
$BINARY add-wasm-message store ${VAULT_CONTRACT} --output json --run-as ${ADMIN_ADDRESS} --keyring-backend=test --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${DAO_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${PROPOSAL_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${VOTING_REGISTRY_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${PRE_PROPOSAL_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${PROPOSAL_MULTIPLE_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${PRE_PROPOSAL_MULTIPLE_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${TREASURY_CONTRACT} --output json --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
# Instantiate the contract
VAULT_INIT="$(printf '{
                        "denom": "%s",
                        "description": "based neutron vault"
}' "$STAKEDENOM")"
DAO_INIT='{
            "description": "basic neutron dao",
            "name": "Neutron",
            "initial_items": null,
            "proposal_modules_instantiate_info": [
              {
                "code_id": 3,
                "label": "DAO_Neutron_cw-proposal-single",
                "msg": "CnsKICAgImFsbG93X3Jldm90aW5nIjpmYWxzZSwKICAgInByZV9wcm9wb3NlX2luZm8iOnsKICAgICAgIk1vZHVsZU1heVByb3Bvc2UiOnsKICAgICAgICAgImluZm8iOnsKICAgICAgICAgICAgImNvZGVfaWQiOjUsCiAgICAgICAgICAgICJtc2ciOiAiZXdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FpWkdWd2IzTnBkRjlwYm1adklqcDdDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0prWlc1dmJTSTZld29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBaWRHOXJaVzRpT25zS0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSW1SbGJtOXRJanA3Q2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNKdVlYUnBkbVVpT2lKemRHRnJaU0lLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmUW9nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUNpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHNDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJbUZ0YjNWdWRDSTZJQ0l4TURBd0lpd0tJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWljbVZtZFc1a1gzQnZiR2xqZVNJNkltRnNkMkY1Y3lJS0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlN3S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSW05d1pXNWZjSEp2Y0c5ellXeGZjM1ZpYldsemMybHZiaUk2Wm1Gc2MyVUtJQ0FnSUNBZ0lDQWdJQ0FnZlFvSyIsCiAgICAgICAgICAgICJsYWJlbCI6Im5ldXRyb24iCiAgICAgICAgIH0KICAgICAgfQogICB9LAogICAib25seV9tZW1iZXJzX2V4ZWN1dGUiOmZhbHNlLAogICAibWF4X3ZvdGluZ19wZXJpb2QiOnsKICAgICAgInRpbWUiOjYwNDgwMAogICB9LAogICAiY2xvc2VfcHJvcG9zYWxfb25fZXhlY3V0aW9uX2ZhaWx1cmUiOmZhbHNlLAogICAidGhyZXNob2xkIjp7CiAgICAgICJ0aHJlc2hvbGRfcXVvcnVtIjp7CiAgICAgICAgICJxdW9ydW0iOnsKICAgICAgICAgICAgInBlcmNlbnQiOiIwLjIwIgogICAgICAgICB9LAogICAgICAgICAidGhyZXNob2xkIjp7CiAgICAgICAgICAgICJtYWpvcml0eSI6ewogICAgICAgICAgICAgICAKICAgICAgICAgICAgfQogICAgICAgICB9CiAgICAgIH0KICAgfQp9"
              },
              {
                "code_id": 6,
                "label": "DAO_Neutron_cw-proposal-multiple",
                "msg": "ewogICAiYWxsb3dfcmV2b3RpbmciOmZhbHNlLAogICAicHJlX3Byb3Bvc2VfaW5mbyI6ewogICAgICAiTW9kdWxlTWF5UHJvcG9zZSI6ewogICAgICAgICAiaW5mbyI6ewogICAgICAgICAgICAiY29kZV9pZCI6NywKICAgICAgICAgICAgIm1zZyI6ICJld29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWlaR1Z3YjNOcGRGOXBibVp2SWpwN0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDSmtaVzV2YlNJNmV3b2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FpZEc5clpXNGlPbnNLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJbVJsYm05dElqcDdDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0p1WVhScGRtVWlPaUp6ZEdGclpTSUtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZRb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5Q2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwc0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0ltRnRiM1Z1ZENJNklDSXhNREF3SWl3S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBaWNtVm1kVzVrWDNCdmJHbGplU0k2SW1Gc2QyRjVjeUlLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU3dLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJbTl3Wlc1ZmNISnZjRzl6WVd4ZmMzVmliV2x6YzJsdmJpSTZabUZzYzJVS0lDQWdJQ0FnSUNBZ0lDQWdmUW9LIiwKICAgICAgICAgICAgImxhYmVsIjoibmV1dHJvbiIKICAgICAgICAgfQogICAgICB9CiAgIH0sCiAgICJvbmx5X21lbWJlcnNfZXhlY3V0ZSI6ZmFsc2UsCiAgICJtYXhfdm90aW5nX3BlcmlvZCI6ewogICAgICAidGltZSI6NjA0ODAwCiAgIH0sCiAgICJjbG9zZV9wcm9wb3NhbF9vbl9leGVjdXRpb25fZmFpbHVyZSI6ZmFsc2UsCiAgICJ2b3Rpbmdfc3RyYXRlZ3kiOnsKICAgICAic2luZ2xlX2Nob2ljZSI6IHsKCQkJCSJxdW9ydW0iOiB7CgkJCQkJIm1ham9yaXR5IjogewogICAgICAgICAgfQogICAgICAgIH0KICAgICB9CiAgIH0KfQ=="
              }
            ],
            "voting_registry_module_instantiate_info": {
              "code_id": 4,
              "label": "DAO_Neutron_voting_registry",
              "msg": "ewogICAgICAibWFuYWdlciI6IG51bGwsCiAgICAgICJvd25lciI6IG51bGwsCiAgICAgICJ2b3RpbmdfdmF1bHQiOiAibmV1dHJvbjE0aGoydGF2cThmcGVzZHd4eGN1NDRydHkzaGg5MHZodWpydmNtc3RsNHpyM3R4bWZ2dzlzNWMyZXBxIgogICAgfQ=="
            }
    }'
# TODO: properly initialize treasury
TREASURY_INIT="$(printf '{
                           "owner": "%s",
                           "denom": "%s",
                           "distribution_rate": "0.1",
                           "min_period": 10,
                           "distribution_contract": "%s",
                           "reserve_contract": "%s"
}' "$ADMIN_ADDRESS" "$STAKEDENOM" "$ADMIN_ADDRESS" "$ADMIN_ADDRESS")"

echo "Instantiate contracts"
$BINARY add-wasm-message instantiate-contract 1 "$VAULT_INIT" --run-as ${ADMIN_ADDRESS} --admin ${ADMIN_ADDRESS} --label "DAO_Neutron_voting_vault" --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message instantiate-contract 2 "$DAO_INIT" --run-as ${ADMIN_ADDRESS} --admin ${ADMIN_ADDRESS} --label "DAO" --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message instantiate-contract 8 "$TREASURY_INIT" --run-as ${ADMIN_ADDRESS} --admin ${ADMIN_ADDRESS} --label "Treasury" --home $CHAIN_DIR/$CHAINID

sed -i -e 's/\"admins\":.*/\"admins\": [\"neutron1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrqcd0mrx\"]/g' $CHAIN_DIR/$CHAINID/config/genesis.json
