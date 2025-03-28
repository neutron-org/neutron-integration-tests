#!/bin/bash
set -e

ORACLE_ADDRESS=${ORACLE_ADDRESS:-localhost:8080}
ORACLE_METRICS_ENABLED=${ORACLE_METRICS_ENABLED:-true}
ORACLE_CLIENT_TIMEOUT=${ORACLE_CLIENT_TIMEOUT:-300ms}

sed -i -e 's/oracle_address = "localhost:8080"/oracle_address = '\""$ORACLE_ADDRESS"\"'/g' "$CHAIN_HOME/config/app.toml"
sed -i -e 's/client_timeout = "2s"/client_timeout = '\""$ORACLE_CLIENT_TIMEOUT"\"'/g' "$CHAIN_HOME/config/app.toml"
sed -i -e 's/metrics_enabled = true/metrics_enabled = '\""$ORACLE_METRICS_ENABLED"\"'/g' "$CHAIN_HOME/config/app.toml"