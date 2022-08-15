# put your path to the neutron-contracts packages folder
export NEUTRON_PATH=~/projects/neutron-contracts/packages

docker run --rm -v "$(pwd)":/code \
    --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
    --volume $NEUTRON_PATH:"/neutron-contracts/packages" \
    --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
    cosmwasm/workspace-optimizer:0.12.6

# TODO: once neutron-contracts code is opensourced, remove the above and uncomment
# the original building command below
# 
# docker run --rm -v "$(pwd)":/code \
#    --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
#    --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
#    cosmwasm/workspace-optimizer:0.12.6