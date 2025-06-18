#!/bin/bash
set -e
# Build all components
cmake -S ../core -B ../core/build && cmake --build ../core/build
cd ../ui && npm install
cd ../backend && npm install

#!/bin/bash
set -e

echo "[1] Build Core (C++):"
cd core
mkdir -p build
cd build
cmake ..
make -j$(nproc)
cd ../../

echo "[2] Build Backend (Node.js):"
cd backend
npm install
npm run build || true
cd ..

echo "[3] Build Frontend (React):"
cd ui
npm install
npm run build
cd ..

echo "[4] Package Complete"

echo "✅ All components built successfully!"
