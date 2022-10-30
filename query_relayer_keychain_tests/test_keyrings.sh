#!/bin/bash

echo "Run kv test with os keyring"
RELAYER_VERSION=os-test yarn test:interchain_kv_query
echo "Run kv test with test keyring"
RELAYER_VERSION=test-test yarn test:interchain_kv_query
echo "Run kv test with memory keyring"
RELAYER_VERSION=memory-test yarn test:interchain_kv_query
