# How to run this code?

## Prerequisities

- Docker engine
- Node.js version 16

### 1. Clone neutron, gaia and neutron-query-relayer

Clone neutron and relayer to the parent directory:

```shell
git clone git@github.com:neutron-org/neutron.git
git clone git@github.com:neutron-org/neutron-query-relayer.git
```

We use the Gaia network as a host network, so you need to clone it next to the neutron repos. We use v9.0.3 for the tests.

```shell
git clone git@github.com:cosmos/gaia.git
git checkout v9.0.3
```

### 2. Prepare docker environment

For the first run it's required to run `make build-all` in the `setup/` directory to build all the docker images before you run the tests with `yarn test`

### 3. Install dependencies with command

```shell
yarn
```

### 4. Download or build contracts

#### Downloading

The pre-build contracts for specific commits are stored in the publicly available Google Cloud Bucket.
One can download them via following commands:

```shell
node download_artifacts.js neutron-dao neutron-dev-contracts
node download_artifacts.js neutron-tge-contracts -b main
```

If you want to specify any specific branch/commit, use the following command to get more info on how to do that:

```shell
node download_artifacts.js --help
```

#### Building

If the contracts version you need is unavailable, or you need a custom one, you can easily use the contracts built by yourself.
To do so, build the contracts from [neutron-dev-contracts](https://github.com/neutron-org/neutron-dev-contracts) and [neutron-dao](https://github.com/neutron-org/neutron-dao) by following respective instructions.
After artifacts build, put all built `.wasm` files to `contracts/` directory.

### 5. Run the tests (make sure docker daemon is running)

```shell
yarn test # all tests
yarn test:simple # basic tests
yarn test:interchaintx # interchain txs test
yarn test:interchain_tx_query # interchain tx query test
yarn test:interchain_kv_query # interchain kv query test
```

NOTE: To speed up tests you can run the cosmopark by youself with `make start-cosmopark` in the setup dir. To run test with the already running cosmopark use `NO_DOCKER` env variable.

```shell
NO_DOCKER=1 yarn test # all tests
...
```

## Development

If you're developing integration tests and need to add additional helper methods to the @neutron-org/neutronjs packages, start by cloning the package repository. Use the command git clone git@github.com:neutron-org/neutronjs.git. After cloning, you have two options: either alter the package reference in the package.json file to point to your cloned repository, or use yarn link.

Once the JavaScript helper code in your local repository is ready, your next step is to create a Pull Request (PR). This PR must be reviewed and approved before it can be merged into the main branch.

However, even after the merge, you cannot immediately use the new package version in your integration tests. First, you need to wait until the updated version of the package will be published to the npmjs repository. After the new version has been published, you can incorporate it into your integration tests. This will allow you to complete the testing sequence in your GitHub Actions workflow.

## Warning

Since docker-compose doesn't rebuild images on file changing, there is a chance for one to launch the tests with an
outdated version of code if one changed something. To rebuild the images from scratch, do the following:

```
cd ../neutron
docker rmi neutron-node
docker rmi neutron-org/neutron-query-relayer
docker-compose build
```

## Environment variables you can redefine

```env
NEUTRON_DENOM - neutron network denom
COSMOS_DENOM - gaia (cosmoshub) network denom
CONTRACTS_PATH - path to contracts that will be used in tests
NEUTRON_ADDRESS_PREFIX - address prefix for neutron controller network
COSMOS_ADDRESS_PREFIX - address prefix for gaia (cosmoshub) host network
NODE1_URL - url to the first node
NODE1_WS_URL - url to websocket of the first node
NODE2_URL - url to the second node
NODE2_WS_URL - url to websocket of the second node
BLOCKS_COUNT_BEFORE_START - how many blocks we wait before start first test
NO_DOCKER - do not start cosmopark for tests
NO_REBUILD - skip containers rebuilding
```

## Config

```
src/config.json
```
