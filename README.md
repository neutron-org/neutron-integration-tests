# How to run this code?

#### 0. Clone neutron and cosmos-query-relayer

Clone neutron from git@github.com:neutron-org/neutron.git and relayer git@github.com:neutron-org/cosmos-query-relayer.git to the parent directory

#### 1. Copy artifacts into contracts folder

```shell
cp -r ./../neutron-contracts/artifacts ./contracts
```

#### 2.Install dependencies with command

```shell
yarn
```

#### 3. Run the tests

```
yarn test # all tests
yarn test:simple # basic tests
yarn test:interchaintx # interchain txs test
yarn test:interchain_tx_query # interchain tx query test
```

#### 4. Environment variables you can redefine

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

#### 4. Config

```
src/config.json
```
