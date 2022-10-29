#!/bin/bash

docker build query_relayer_keychain_tests/os_test     -t neutron-org/neutron-query-relayer-os-test
#docker build query_relayer_keychain_tests/memory_test -t neutron-org/neutron-query-relayer-memory-test
#docker build query_relayer_keychain_tests/test_test   -t neutron-org/neutron-query-relayer-memory-test

docker-compose stop -f setup/docker-compose.yml
RELAYER_SUFFIX=os-test docker-compose up -d -f setup/docker-compose.yml
yarn test:interchain_kv_query
