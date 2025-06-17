#!/bin/bash
set -e
# Build all components
cmake -S ../core -B ../core/build && cmake --build ../core/build
cd ../ui && npm install
cd ../backend && npm install
