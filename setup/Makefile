APP_DIR ?= ../..
COMPOSE ?= docker compose

build-gaia:
		@docker buildx build --load --build-context app=$(APP_DIR)/gaia --build-context setup=$(APP_DIR)/neutron/network -t gaia-node -f dockerbuilds/Dockerfile.gaia --build-arg BINARY=gaiad .

build-neutron:
		@docker buildx build --load --build-arg PERSISTENT_PEER=neutron-node --build-context app=$(APP_DIR)/neutron --build-context scripts=./scripts -t neutron-node -f dockerbuilds/Dockerfile.neutron --build-arg BINARY=neutrond . --no-cache

build-hermes:
		@docker build -f dockerbuilds/Dockerfile.hermes -t hermes:1.10.4 .

build-relayer:
		@docker buildx build --load --build-context app=$(APP_DIR)/neutron-query-relayer -t neutron-org/neutron-query-relayer -f dockerbuilds/Dockerfile.queryrelayer . --no-cache

build-slinky:
		@docker buildx build --load --build-context app=https://github.com/skip-mev/slinky.git#v1.2.0 -t skip-mev/slinky-e2e-oracle -f dockerbuilds/Dockerfile.slinky .

build-all: build-gaia build-neutron build-hermes build-relayer build-slinky

start-cosmopark:
		@$(COMPOSE) up -d

stop-cosmopark:
		@$(COMPOSE) down --remove-orphans -v

build-gaia-2:
		@docker buildx build --load --build-context app=$(APP_DIR)/gaia --build-context setup=$(APP_DIR)/neutron/network -f dockerbuilds/Dockerfile.gaia-2 -t gaia-node-2 --build-arg BINARY=gaiad .

build-neutron-2:
		@docker buildx build --load --build-context app=$(APP_DIR)/neutron -f dockerbuilds/Dockerfile.neutron-2 -t neutron-node-2 --build-arg BINARY=neutrond . --no-cache

build-hermes-2:
		@docker build -f dockerbuilds/Dockerfile.hermes-2 -t hermes-2:1.10.4 .

build-relayer-2:
		docker build -t neutron-org/neutron-query-relayer-2 $(APP_DIR)/neutron-query-relayer

start-cosmopark-2:
		cosmopark start config.json

stop-cosmopark-2:
		cosmopark stop config.json

start-neutron-node:
		@$(COMPOSE) up neutron-node
