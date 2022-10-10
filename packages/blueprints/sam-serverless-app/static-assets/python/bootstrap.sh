#!/bin/bash

VENV="venv"

test -d $VENV || python3 -m venv $VENV || return
$VENV/bin/pip install -r requirements-dev.txt
$VENV/bin/pip install -r {{lambdaFunctionName}}/hello_world/requirements.txt
. $VENV/bin/activate
