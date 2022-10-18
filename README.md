# How to run this code?

### 0. Clone neutron, gaia and cosmos-query-relayer

Clone neutron and relayer to the parent directory:

```shell
git clone git@github.com:neutron-org/neutron.git
git clone git@github.com:neutron-org/neutron-query-relayer.git
```

We use the Gaia network as a host network, so you need to clone it next to the neutron repos. We use v7.0.3 for the tests.

```shell
git clone git@github.com:cosmos/gaia.git
git checkout v7.0.3
```

### 1. Prepare docker environment

For the first run it's required to run `make build-all` in the setup directory to build all the docker images before you run the tests with `yarn test`

### 2. Install dependencies with command

```shell
yarn
```

### 3. Run the tests (make sure docker daemon is running)

```shell
yarn test # all tests
yarn test:simple # basic tests
yarn test:interchaintx # interchain txs test
yarn test:interchain_tx_query # interchain tx query test
yarn test:interchain_kv_query # interchain tx query test
```

NOTE: To speed up tests you can run the cosmopark by youself with `make start-cosmopark` in the setup dir. To run test with the already running cosmopark use `NO_DOCKER` env variable.

```shell
NO_DOCKER=1 yarn test # all tests
...
```

## Environment variables you can redefine

```env
NEUTRON_DENOM - neutron network denom
COSMOS_DENOM - gaia (cosmoshub) network denom
CONTRACTS_PATH - path to contracts that will be used in tests
NEUTRON_ADDRESS_PREFIX - address prefix for neutron controller network
COSMOS_ADDRESS_PREFIX - address prefix for gaia (cosmoshub) host network
NODE1_URL - url to the first node
NODE2_URL - url to the second node
BLOCKS_COUNT_BEFORE_START - how many blocks we wait before start first test
NO_DOCKER - do not start cosmopark for tests
```

## Config

```
src/config.json
```
