# TODO: Next Steps for Stream

## High Priority
- Integrate Google WebRTC C++ library in `core/`
- Implement real-time screen/audio capture and encoding (DXGI/NVENC, ScreenCaptureKit/VideoToolbox)
- Wire up signaling between backend, UI, and core
- Begin virtual camera/mic driver development (DirectShow, AVFoundation, v4l2loopback)
- Implement remote input injection (WinAPI, Quartz, XTest)

## Medium Priority
- Add authentication and security to backend
- Add SaaS multi-tenancy and user/session management
- Expand UI for device selection and remote control
- Add automated tests and CI/CD

## Low Priority
- Add advanced network resilience (FEC, congestion control)
- Add analytics and monitoring
