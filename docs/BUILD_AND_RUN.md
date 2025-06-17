# Build and Run Instructions

## Prerequisites
- CMake 3.15+
- C++20 compiler (MSVC, Clang, GCC)
- Node.js 18+
- npm

## Build Native Core
```
cd core
cmake -B build
cmake --build build
```

## Start Backend
```
cd backend
npm install
npm start
```

## Start UI
```
cd ui
npm install
npm start
```

## End-to-End Test
1. Start backend
2. Start two UI windows, connect both, exchange peer IDs
3. (Coming soon) Start core app for real streaming
