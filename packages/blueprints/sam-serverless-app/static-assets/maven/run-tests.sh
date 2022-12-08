#!/usr/bin/env bash

echo "Running unit tests..."
mvn test -f {{lambdaFunctionName}}/HelloWorldFunction
