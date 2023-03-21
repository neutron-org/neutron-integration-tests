APP_DIR ?= ../..
COMPOSE ?= docker-compose

build-gaia:
		@docker buildx build --load --build-context app=$(APP_DIR)/gaia --build-context setup=$(APP_DIR)/neutron/network -t gaia-node -f dockerbuilds/Dockerfile.gaia --build-arg BINARY=gaiad .

build-neutron:
		@docker buildx build --load --build-context app=$(APP_DIR)/neutron -t neutron-node -f dockerbuilds/Dockerfile.neutron --build-arg BINARY=neutrond .

build-hermes:
		@docker build -f dockerbuilds/Dockerfile.hermes -t hermes:a577b27 .

build-relayer:
		cd $(APP_DIR)/neutron-query-relayer/ && make build-docker

build-all: build-gaia build-neutron build-hermes build-relayer

start-cosmopark: build-neutron build-relayer
		@$(COMPOSE) up -d

start-cosmopark-no-rebuild:
		@$(COMPOSE) up -d

stop-cosmopark:
		@$(COMPOSE) down -t0 --remove-orphans -v
