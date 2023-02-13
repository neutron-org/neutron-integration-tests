build-gaia:
		@docker buildx build --load --build-context app=../../gaia --build-context setup=./node -t gaia-node -f dockerbuilds/Dockerfile.gaia --build-arg BINARY=gaiad .

build-gaia-ci:
		@docker buildx build --load --build-context app=../repos/gaia --build-context setup=./node -t gaia-node -f dockerbuilds/Dockerfile.gaia --build-arg BINARY=gaiad .

build-neutron:
		@docker buildx build --load --build-context app=../../neutron --build-context setup=./node -t neutron-node -f dockerbuilds/Dockerfile.neutron --build-arg BINARY=neutrond .

build-neutron-ci:
		@docker buildx build --load --build-context app=../repos/neutron --build-context setup=./node -t neutron-node -f dockerbuilds/Dockerfile.neutron --build-arg BINARY=neutrond .

build-hermes:
		@docker build -f dockerbuilds/Dockerfile.hermes -t hermes:1.0.0 .

build-relayer:
		cd ../../neutron-query-relayer/ && make build-docker

build-relayer-ci:
		cd ../repos/neutron-query-relayer/ && make build-docker

build-all: build-gaia build-neutron build-hermes build-relayer

build-all-ci: build-gaia-ci build-neutron-ci build-hermes build-relayer-ci

start-cosmopark: build-neutron build-relayer
		@docker-compose up -d 

start-cosmopark-no-rebuild:
		@docker-compose up -d 

stop-cosmopark:
		@docker-compose down -t0 --remove-orphans -v

start-network:
		@docker compose up -d 

stop-network:
		@docker compose down -t0 --remove-orphans -v
