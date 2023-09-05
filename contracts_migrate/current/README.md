Contract versions currently deployed on Neutron mainnet. Retrieved for each contract to be migrated via:

1. Get contract address from [Mainnet deployments page](https://docs.neutron.org/deployment/mainnet/);
2. Run `neutrond q wasm contract <addr>` for a mainnet node, get the `contract_info.code_id` value;
3. Run `neutrond q wasm code <code_id> <binary_name.wasm>` for a mainnet node.
