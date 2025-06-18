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
