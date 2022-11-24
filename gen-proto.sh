#!/usr/bin/env bash

rm -r ./proto
rm -r ./proto-thirdparty
cp -r ../neutron/proto ./proto
cp -r ../neutron/third_party/proto ./proto-thirdparty

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

npx pbts \
  -o ./src/generated/proto.d.ts \
  ./src/generated/proto.cjs

rm -r ./proto
rm -r ./proto-thirdparty