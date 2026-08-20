#!/usr/bin/env bash
# Regenerate the typescript-axios client in gen/iwfidl/ from the IDL spec.
# Uses the pinned openapi-generator version from openapitools.json (requires a JVM).
set -euo pipefail

rm -Rf ./gen
npx openapi-generator-cli generate \
  -i ./iwf-idl/iwf-sdk.yaml \
  -g typescript-axios \
  -o ./gen/iwfidl/ \
  -p packageName=iwfidl \
  -p generateInterfaces=true \
  -p isGoSubmodule=false \
  --git-user-id indeedeng --git-repo-id iwf-idl
