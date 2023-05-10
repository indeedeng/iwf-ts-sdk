rm -Rf ./gen ; true
openapi-generator generate -i ./iwf-idl/iwf-sdk.yaml -g typescript-axios -o ./gen/iwfidl/ -p packageName=iwfidl -p generateInterfaces=true -p isGoSubmodule=false --git-user-id indeedeng --git-repo-id iwf-idl
