#!/usr/bin/env bash

echo "Running unit tests..."
GRADLE_DIR={{lambdaFunctionName}}/HelloWorldFunction
./$GRADLE_DIR/gradlew test -p $GRADLE_DIR
