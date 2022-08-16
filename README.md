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
```

#### 4. Environment variables you can redefine

```
NEUTRON_DIR
DENOM
CONTRACTS_PATH
ADDRESS_PREFIX
NODE1_URL
NODE2_URL
BLOCKS_COUNT_BEFORE_START
NO_DOCKER
BLOCK_TIME
```

#### 4. Config

```
src/config.json
```
