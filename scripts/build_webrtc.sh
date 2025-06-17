#!/bin/bash
# Script to fetch and build Google WebRTC for your platform
# See: https://webrtc.googlesource.com/src/ + official docs
set -e

if [ ! -d ../core/third_party ]; then
  mkdir -p ../core/third_party
fi
cd ../core/third_party

echo "Cloning WebRTC (this may take a while)..."
git clone https://webrtc.googlesource.com/src webrtc || true
cd webrtc

# Install depot_tools if not present
if [ ! -d ../depot_tools ]; then
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git ../depot_tools
fi
export PATH=$PATH:$(pwd)/../depot_tools

# Fetch and build (see official docs for platform-specific flags)
python3 tools_webrtc/get_landmines.py || true
python3 tools_webrtc/gn_args.py || true
gn gen out/Default --args='is_debug=false rtc_include_tests=false'
ninja -C out/Default

echo "WebRTC build complete. Set WEBRTC_ROOT to $(pwd)/out/Default in core/CMakeLists.txt."
