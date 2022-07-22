clean:
	for i in `seq 0 3`; do rm -rf ./configs/node$${i}/simd/data; cp -R ./data ./configs/node$${i}/simd/; rm -rf ./configs/node$${i}/simd/wasm; done;

start:
	docker-compose up -d

restart: stop clean start

stop:
	docker-compose down --remove-orphans

