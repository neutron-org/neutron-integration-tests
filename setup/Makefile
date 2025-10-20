APP_DIR ?= ../..
COMPOSE ?= docker compose

build-gaia:
		@docker buildx build --load --build-context app=$(APP_DIR)/gaia --build-context setup=$(APP_DIR)/neutron/network -f dockerbuilds/Dockerfile.gaia -t gaia-node --build-arg BINARY=gaiad .

build-neutron:
		@docker buildx build --load --build-context app=$(APP_DIR)/neutron -f dockerbuilds/Dockerfile.neutron -t neutron-node --build-arg BINARY=neutrond . --no-cache

build-hermes:
		@docker build -f dockerbuilds/Dockerfile.hermes -t hermes:1.10.4 .

build-relayer:
		docker build -t neutron-org/neutron-query-relayer $(APP_DIR)/neutron-query-relayer

build-slinky:
		@docker buildx build --load --build-context app=https://github.com/skip-mev/slinky.git#v1.2.0 -t skip-mev/slinky-e2e-oracle -f dockerbuilds/Dockerfile.slinky .

build-all: build-gaia build-neutron build-hermes build-relayer build-slinky

start-cosmopark:
		cosmopark start config.json

stop-cosmopark:
		cosmopark stop config.json

start-neutron-node:
		@$(COMPOSE) up neutron-node
