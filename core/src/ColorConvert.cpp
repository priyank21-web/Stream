#include "ColorConvert.h"

// Simple BGRA to I420 conversion (no SIMD, not optimized)
void ConvertBGRAtoI420(const uint8_t* src, int width, int height,
                       uint8_t* dst_y, int stride_y,
                       uint8_t* dst_u, int stride_u,
                       uint8_t* dst_v, int stride_v) {
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            int idx = (y * width + x) * 4;
            uint8_t B = src[idx + 0];
            uint8_t G = src[idx + 1];
            uint8_t R = src[idx + 2];
            // Y plane
            dst_y[y * stride_y + x] = (uint8_t)((66 * R + 129 * G + 25 * B + 128) >> 8) + 16;
            // U/V planes (4:2:0 subsampling)
            if ((y % 2 == 0) && (x % 2 == 0)) {
                int sumU = 0, sumV = 0;
                for (int dy = 0; dy < 2; ++dy) {
                    for (int dx = 0; dx < 2; ++dx) {
                        int sx = x + dx;
                        int sy = y + dy;
                        if (sx < width && sy < height) {
                            int sidx = (sy * width + sx) * 4;
                            uint8_t b = src[sidx + 0];
                            uint8_t g = src[sidx + 1];
                            uint8_t r = src[sidx + 2];
                            int U = ((-38 * r - 74 * g + 112 * b + 128) >> 8) + 128;
                            int V = ((112 * r - 94 * g - 18 * b + 128) >> 8) + 128;
                            sumU += U;
                            sumV += V;
                        }
                    }
                }
                dst_u[(y / 2) * stride_u + (x / 2)] = (uint8_t)(sumU / 4);
                dst_v[(y / 2) * stride_v + (x / 2)] = (uint8_t)(sumV / 4);
            }
        }
    }
}
