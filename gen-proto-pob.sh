#!/usr/bin/env bash

rm -r ./proto
rm -r ./proto-thirdparty-tmp
rm -rf ./pob

git clone git@github.com:skip-mev/block-sdk.git
# cd ibc-go && git checkout v4.3.0 && cd ../

# git clone git@github.com:Ethernal-Tech/admin-module.git

cp -r block-sdk/proto ./proto
# cp -r ibc-go/third_party/proto ./proto-thirdparty-tmp
# mv ./proto-thirdparty-tmp/tendermint ./proto/
# cp -r ./admin-module/proto/adminmodule ./proto/

proto_dirs=$(find ./proto -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
proto_files=()

for dir in $proto_dirs; do
  proto_files=("${proto_files[@]} $(find "${dir}" -maxdepth 1 -name '*.proto')")
done

echo ${proto_files[@]}

npx pbjs \
  -o ./src/generated/pob/proto.cjs \
  -t static-module \
  --force-long \
  --keep-case \
  --no-create \
  --path=./proto/ \
  --path=./proto-thirdparty/ \
  --root="@skip-mev/pob" \
  ${proto_files[@]}

npx pbjs \
  -o ./src/generated/pob/proto.js \
  -t static-module \
  -w es6 \
  --es6 \
  --force-long \
  --keep-case \
  --no-create \
  --path=./proto/ \
  --path=./proto-thirdparty/ \
  --root="@skip-mev/pob" \
  ${proto_files[@]}

npx pbts \
  -o ./src/generated/pob/proto.d.ts \
  ./src/generated/pob/proto.js

rm -r ./proto
# rm -r ./proto-thirdparty-tmp
rm -rf ./block-sdk
# rm -rf ./admin-module
