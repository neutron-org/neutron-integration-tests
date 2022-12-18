#!/bin/bash

BINARY=${BINARY:-neutrond}
CHAIN_DIR=./data
CHAINID=${CHAINID:-test-1}
STAKEDENOM=${STAKEDENOM:-stake}

ADMIN_ADDRESS=neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2
DAO_CONTRACT=/opt/neutron/contracts/dao/cwd_core.wasm
PROPOSAL_CONTRACT=/opt/neutron/contracts/dao/cwd_proposal_single.wasm
VOTING_REGISTRY_CONTRACT=/opt/neutron/contracts/dao/neutron_voting_registry.wasm
VAULT_CONTRACT=/opt/neutron/contracts/dao/neutron_vault.wasm

echo "Add consumer section..."
$BINARY add-consumer-section --home $CHAIN_DIR/$CHAINID

echo "Initializing dao contract in genesis..."
# Upload the dao contract
$BINARY add-wasm-message store ${VAULT_CONTRACT} --output json --run-as ${ADMIN_ADDRESS} --keyring-backend=test --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${DAO_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${PROPOSAL_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message store ${VOTING_REGISTRY_CONTRACT} --output json  --run-as ${ADMIN_ADDRESS} --home $CHAIN_DIR/$CHAINID
# Instantiate the contract
INIT="{\"denom\":\"${STAKEDENOM}\"}"
DAO_INIT='{
            "admin": null,
            "automatically_add_cw20s": false,
            "automatically_add_cw721s": false,
            "description": "basic neutron dao",
            "image_url": null,
            "name": "Neutron",
            "initial_items": null,
            "proposal_modules_instantiate_info": [
              {
                "admin": null,
                "code_id": 3,
                "label": "DAO_Neutron_cw-proposal-single",
                "msg": "ewogICAgICAgICJhbGxvd19yZXZvdGluZyI6IGZhbHNlLAogICAgICAgICJwcmVfcHJvcG9zZV9pbmZvIjogewogICAgICAgICAgIkFueW9uZU1heVByb3Bvc2UiOiB7fQogICAgICAgIH0sCiAgICAgICAgImRlcG9zaXRfaW5mbyI6IG51bGwsCiAgICAgICAgImNsb3NlX3Byb3Bvc2FsX29uX2V4ZWN1dGlvbl9mYWlsdXJlIjogZmFsc2UsCiAgICAgICAgIm1heF92b3RpbmdfcGVyaW9kIjogewogICAgICAgICAgInRpbWUiOiA2MDQ4MDAKICAgICAgICB9LAogICAgICAgICJvbmx5X21lbWJlcnNfZXhlY3V0ZSI6IGZhbHNlLAogICAgICAgICJ0aHJlc2hvbGQiOiB7CiAgICAgICAgICAidGhyZXNob2xkX3F1b3J1bSI6IHsKICAgICAgICAgICAgInF1b3J1bSI6IHsKICAgICAgICAgICAgICAicGVyY2VudCI6ICIwLjIwIgogICAgICAgICAgICB9LAogICAgICAgICAgICAidGhyZXNob2xkIjogewogICAgICAgICAgICAgICJtYWpvcml0eSI6IHt9CiAgICAgICAgICAgIH0KICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIH0="
              }
            ],
            "voting_registry_module_instantiate_info": {
              "admin": null,
              "code_id": 4,
              "label": "DAO_Neutron_voting_registry",
              "msg": "ewogICAgICAibWFuYWdlciI6IG51bGwsCiAgICAgICJvd25lciI6IG51bGwsCiAgICAgICJ2b3RpbmdfdmF1bHQiOiAibmV1dHJvbjE0aGoydGF2cThmcGVzZHd4eGN1NDRydHkzaGg5MHZodWpydmNtc3RsNHpyM3R4bWZ2dzlzNWMyZXBxIgogICAgfQ=="
            }
    }'

echo "Instantiate contracts"
$BINARY add-wasm-message  instantiate-contract 1 ${INIT} --run-as ${ADMIN_ADDRESS} --admin ${ADMIN_ADDRESS}  --label "DAO_Neutron_voting_vault"  --home $CHAIN_DIR/$CHAINID
$BINARY add-wasm-message  instantiate-contract 2 "$DAO_INIT" --run-as ${ADMIN_ADDRESS} --admin ${ADMIN_ADDRESS}  --label "DAO"  --home $CHAIN_DIR/$CHAINID

sed -i -e 's/\"admins\":.*/\"admins\": [\"neutron1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrqcd0mrx\"]/g' $CHAIN_DIR/$CHAINID/config/genesis.json
