# How to run this code?

### 0. Clone neutron and neutron-query-relayer

Clone neutron and relayer to the parent directory:

```
git clone git@github.com:neutron-org/neutron.git
git clone git@github.com:neutron-org/neutron-query-relayer.git
```

### 1. Install dependencies with command

```shell
yarn
```

### 2. Run the tests (make sure docker daemon is running)

```
yarn test # all tests
yarn test:simple # basic tests
yarn test:interchaintx # interchain txs test
yarn test:interchain_tx_query # interchain tx query test
yarn test:interchain_kv_query # interchain tx query test
```

## Warning

Since docker-compose doesn't rebuild images on file changing, there is a chance for one to launch the tests with an
outdated version of code if you changed something. To rebuild the images from scratch, do the following:

```
cd ../neutron
docker rmi neutron_node
docker rmi neutron-org/neutron-query-relayer
docker-compose build
```

## Environment variables you can redefine

```
NEUTRON_DIR - directory where Neutron is located
DENOM - denom used for tests
CONTRACTS_PATH - path to contracts that will be used in tests
ADDRESS_PREFIX - address prefix
NODE1_URL - url to the first node
NODE2_URL - url to the second node
BLOCKS_COUNT_BEFORE_START - how many blocks we wait before start first test
NO_DOCKER - do not start cosmopark for tests
BLOCK_TIME - time in ms for 1 block production
```

## Config

```
src/config.json
```
