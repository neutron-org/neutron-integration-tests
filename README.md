# How to run this code?

#### 0. Clone wasmd repository and build image

```shell
git clone https://github.com/cosmos/wasmd -b feat/wasmd-ibcv3-ls-module-alongside-cosmos-sdk
cd wasmd
docker build . -t wasm-n
```

#### 1. Clone repository and install or update dependencies with command

```shell
yarn
```

#### 2. Put Lido artifacts in the `./lido-cosmos-contracts/artifacts` directory

#### 3. Run the 4-validators LocalTerra set up

To start the 4-set validators environment - run `make start` in the `testkit` dir:

```
cd testkit
make restart
```

#### 4. Run the tests

```
yarn test:short:statom
yarn test:long:statom
yarn test:short:pausable
yarn test:short:redistribution
yarn test:short:slashing
```

#### 5. Environment variables you can redefine

```
NEUTRON_DIR
DENOM
CONTRACTS_PATH
CHAIN_ID
ADDRESS_PREFIX
NODE1_URL
NODE2_URL
```

**Note: it is recommended to clear env with `make restart` before each run to reset the state.**
