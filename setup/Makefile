build-gaia:
		@docker buildx build  --build-context app=../../gaia --build-context setup=./node -t gaia-node -f dockerbuilds/Dockerfile.gaia --build-arg BINARY=gaiad .

build-neutron:
		@docker buildx build  --build-context app=../../neutron --build-context setup=./node -t neutron-node -f dockerbuilds/Dockerfile.neutron --build-arg BINARY=neutrond .

build-hermes:
		@docker build -f dockerbuilds/Dockerfile.hermes -t hermes:0.14.1 .

build-relayer:
		docker build ../../neutron-query-relayer -f ../../neutron-query-relayer/Dockerfile -t neutron-org/neutron-query-relayer

start-cosmopark: build-neutron build-relayer
		@docker-compose up -d 

stop-cosmopark:
		@docker-compose down -t0 --remove-orphans -v

