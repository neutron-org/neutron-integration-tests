#!/usr/bin/env bash

rm -r ./proto
cp -r ../neutron/proto ./proto

proto_dirs=$(find ./proto -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
proto_files=()

for dir in $proto_dirs; do
  proto_files=("${proto_files[@]} $(find "${dir}" -maxdepth 1 -name '*.proto')")
done

npx pbjs \
  -o ./src/generated/proto.cjs \
  -t static-module \
  --force-long \
  --keep-case \
  --no-create \
  --path=./proto/ \
  --path=./proto-thirdparty/ \
  --root="@neutron-org/neutron" \
  ${proto_files[@]}

npx pbjs \
  -o ./src/generated/proto.js \
  -t static-module \
  -w es6 \
  --es6 \
  --force-long \
  --keep-case \
  --no-create \
  --path=./proto/ \
  --path=./proto-thirdparty/ \
  --root="@neutron-org/neutron" \
  ${proto_files[@]}

npx pbts \
  -o ./src/generated/proto.d.ts \
  ./src/generated/proto.js

rm ./src/generated/proto.js
rm -r ./proto
