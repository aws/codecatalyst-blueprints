#!/bin/bash

echo "Running unit tests..."
PYTHONPATH={{lambdaFunctionName}} pytest --junitxml=test_results.xml --cov-report xml:test_coverage.xml --cov=. {{lambdaFunctionName}}/tests/unit/
