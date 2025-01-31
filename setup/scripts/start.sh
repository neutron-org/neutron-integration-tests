#!/bin/bash
set -e

BINARY=${BINARY:-neutrond}
CHAINID=${CHAINID:-test-1}
GRPCPORT=${GRPCPORT:-9090}
GRPCWEB=${GRPCWEB:-9091}


RUN_BACKGROUND=${RUN_BACKGROUND:-1}

echo "Starting $CHAINID in $CHAIN_HOME..."
echo "Creating log file at $CHAIN_HOME/$CHAINID.log"
if [ "$RUN_BACKGROUND" == 1 ]; then
  $BINARY start                           \
    --log_level debug                     \
    --home "$CHAIN_HOME"                   \
    --pruning=nothing                     \
    --grpc.address="0.0.0.0:$GRPCPORT"    \
    --trace-store /tmp/store.log          \
    --trace > "$CHAIN_HOME/$CHAINID.log" 2>&1 &
else
  $BINARY start                           \
    --log_level debug                     \
    --home "$CHAIN_HOME"                   \
    --pruning=nothing                     \
    --grpc.address="0.0.0.0:$GRPCPORT"    \
    --trace-store /tmp/store.log          \
    --trace 2>&1 | tee "$CHAIN_HOME/$CHAINID.log"
fi

