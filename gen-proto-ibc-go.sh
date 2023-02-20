#!/usr/bin/env bash

rm -r ./proto
rm -r ./proto-thirdparty-tmp
rm -rf ./ibc-go

git clone git@github.com:cosmos/ibc-go.git
cd ibc-go && git checkout v4.2.0 && cd ../

cp -r ibc-go/proto ./proto
cp -r ibc-go/third_party/proto ./proto-thirdparty-tmp
mv ./proto-thirdparty-tmp/tendermint ./proto/

proto_dirs=$(find ./proto -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
proto_files=()

for dir in $proto_dirs; do
  proto_files=("${proto_files[@]} $(find "${dir}" -maxdepth 1 -name '*.proto')")
done

npx pbjs \
  -o ./src/generated/ibc/proto.cjs \
  -t static-module \
  --force-long \
  --keep-case \
  --no-create \
  --path=./proto/ \
  --path=./proto-thirdparty-tmp/ \
  --root="@cosmos-client/ibc" \
  ${proto_files[@]}

npx pbjs \
  -o ./src/generated/ibc/proto.js \
  -t static-module \
  -w es6 \
  --es6 \
  --force-long \
  --keep-case \
  --no-create \
  --path=./proto/ \
  --path=./proto-thirdparty-tmp/ \
  --root="@cosmos-client/ibc" \
  ${proto_files[@]}

npx pbts \
  -o ./src/generated/ibc/proto.d.ts \
  ./src/generated/ibc/proto.js

rm -r ./proto
rm -r ./proto-thirdparty-tmp
rm -rf ./ibc-go