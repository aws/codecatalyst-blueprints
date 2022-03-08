#!/bin/sh

find . -name node_modules -type d -exec rm -rf "{}" \;
find . -name dist -type d -exec rm -rf "{}" \;
find . -name synth -type d -exec rm -rf "{}" \;
find . -path "./packages/*" -name lib -type d -exec rm -rf "{}" \;
