APP_DIR ?= ../..
COMPOSE ?= docker compose

build-gaia:
		@docker buildx build --load --build-context app=$(APP_DIR)/gaia --build-context setup=$(APP_DIR)/neutron/network -t gaia-node -f dockerbuilds/Dockerfile.gaia --build-arg BINARY=gaiad .

build-neutron:
		cd $(APP_DIR)/neutron && $(MAKE) build-docker-image

build-hermes:
		@docker build -f dockerbuilds/Dockerfile.hermes -t hermes:1.10.1 .

build-relayer:
		cd $(APP_DIR)/neutron-query-relayer/ && make build-docker

build-slinky:
		@docker buildx build --load --build-context app=https://github.com/skip-mev/slinky.git#v1.0.0 -t skip-mev/slinky-e2e-oracle -f dockerbuilds/Dockerfile.slinky .

build-all: build-gaia build-neutron build-hermes build-relayer build-slinky

start-cosmopark:
		@$(COMPOSE) up -d

stop-cosmopark:
		@$(COMPOSE) down -t0 --remove-orphans -v

start-neutron-node:
		@$(COMPOSE) up neutron-node

clean:
		@echo "Removing previous testing data"
		-@docker volume rm neutron-testing-data
