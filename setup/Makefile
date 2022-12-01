build-gaia:
		@docker buildx build --load --build-context app=../../gaia --build-context setup=./node -t gaia-node -f dockerbuilds/Dockerfile.gaia --build-arg BINARY=gaiad .

build-neutron:
		@docker buildx build --load --build-context app=../../neutron --build-context setup=./node -t neutron-node -f dockerbuilds/Dockerfile.neutron --build-arg BINARY=neutrond .

build-hermes:
		@docker build -f dockerbuilds/Dockerfile.hermes -t hermes:1.0.0 .

build-relayer:
		cd ../../neutron-query-relayer/ && make build-docker

build-relayer-keyring-tests: build-neutron build-relayer
		docker build ./relayer_keyrings/os_test     -t neutron-org/neutron-query-relayer:os-test
		docker build ./relayer_keyrings/test_test   -t neutron-org/neutron-query-relayer:test-test
		docker build ./relayer_keyrings/memory_test -t neutron-org/neutron-query-relayer:memory-test
		docker build ./relayer_keyrings/pass_test   -t neutron-org/neutron-query-relayer:pass-test
		docker build ./relayer_keyrings/file_test   -t neutron-org/neutron-query-relayer:file-test

build-all: build-gaia build-neutron build-hermes build-relayer build-relayer-keyring-tests

start-cosmopark: build-neutron build-relayer-keyring-tests
		@docker-compose up -d 

start-cosmopark-no-rebuild:
		@docker-compose up -d 

stop-cosmopark:
		@docker-compose down -t0 --remove-orphans -v
