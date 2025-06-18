#pragma once
#include <cstdint>
#include <stddef.h>

// Convert BGRA (or RGB) to I420. Assumes tightly packed input.
// src: pointer to BGRA data
// width, height: frame dimensions
// dst_y, dst_u, dst_v: pointers to I420 planes
// stride_y, stride_u, stride_v: strides for each plane
void ConvertBGRAtoI420(const uint8_t* src, int width, int height,
                       uint8_t* dst_y, int stride_y,
                       uint8_t* dst_u, int stride_u,
                       uint8_t* dst_v, int stride_v);
