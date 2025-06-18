#!/bin/bash
# Script to fetch and build Google WebRTC for your platform (minimal, production-focused)
set -e

# Set output directory for WebRTC
OUTPUT_DIR="$(pwd)/../third_party/webrtc"
if [ ! -d "$OUTPUT_DIR" ]; then
  mkdir -p "$OUTPUT_DIR"
fi
cd "$OUTPUT_DIR"

# Install depot_tools if not present
if [ ! -d depot_tools ]; then
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git depot_tools
fi
export PATH="$OUTPUT_DIR/depot_tools:$PATH"

# Write minimal .gclient config to exclude only large, unnecessary subdirs (not all of tools)
cat > .gclient <<EOF
solutions = [
  {
    "name": "src",
    "url": "https://webrtc.googlesource.com/src.git",
    "deps_file": "DEPS",
    "managed": False,
    "custom_deps": {
      # Exclude Chromium and other large unused deps, but keep tools for build scripts
      "src/chromium": None,
      "src/third_party/catapult": None,
      "src/third_party/ffmpeg": None,
      "src/third_party/libaom": None,
      "src/third_party/libvpx": None,
      "src/third_party/googletest": None,
      "src/third_party/google_benchmark": None,
      "src/third_party/fuzztest": None,
      "src/build": None,
      "src/buildtools": None
    },
  },
]
EOF

# Fetch WebRTC source (minimal)
if [ ! -d src ]; then
  fetch --nohooks webrtc
fi
cd src

gclient sync --nohooks --no-history --shallow

# Build WebRTC static library (minimal)
gn gen out/Default --args='is_debug=false rtc_include_tests=false rtc_build_examples=false'
ninja -C out/Default

# After build, ensure only minimal headers are available in out/Default/include
INCLUDE_DIR="$OUTPUT_DIR/src/out/Default/include"
mkdir -p "$INCLUDE_DIR"
for d in api rtc_base modules pc media common_video; do
  if [ -d "$OUTPUT_DIR/src/$d" ]; then
    rsync -a --delete "$OUTPUT_DIR/src/$d" "$INCLUDE_DIR/"
  fi
done

echo "WebRTC build complete. Set WEBRTC_ROOT to: $OUTPUT_DIR/src/out/Default"
