#!/bin/bash

RELAYER_VERSION=os-test yarn test:interchain_kv_query
RELAYER_VERSION=test-test yarn test:interchain_kv_query
RELAYER_VERSION=memory-test yarn test:interchain_kv_query
