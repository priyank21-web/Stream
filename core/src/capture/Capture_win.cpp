#include "Capture.h"
#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <thread>
#include <chrono>
#include <iostream>

#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "dxgi.lib")

class WindowsCapture : public Capture
{
public:
    WindowsCapture() : running_(false) {}
    ~WindowsCapture() { Stop(); }

    bool Start(FrameCallback callback) override
    {
        callback_ = callback;
        running_ = true;
        capture_thread_ = std::thread(&WindowsCapture::CaptureLoop, this);
        return true;
    }

    void Stop() override
    {
        running_ = false;
        if (capture_thread_.joinable())
            capture_thread_.join();
    }

private:
    bool running_;
    FrameCallback callback_;
    std::thread capture_thread_;

    void CaptureLoop()
    {
        HRESULT hr;
        ID3D11Device *d3dDevice = nullptr;
        ID3D11DeviceContext *d3dContext = nullptr;
        D3D_FEATURE_LEVEL featureLevel;

        hr = D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, 0,
                               nullptr, 0, D3D11_SDK_VERSION,
                               &d3dDevice, &featureLevel, &d3dContext);
        if (FAILED(hr))
        {
            std::cerr << "Failed to create D3D11 device" << std::endl;
            return;
        }

        IDXGIDevice *dxgiDevice = nullptr;
        d3dDevice->QueryInterface(__uuidof(IDXGIDevice), (void **)&dxgiDevice);

        IDXGIAdapter *dxgiAdapter = nullptr;
        dxgiDevice->GetAdapter(&dxgiAdapter);

        IDXGIOutput *dxgiOutput = nullptr;
        dxgiAdapter->EnumOutputs(0, &dxgiOutput);

        IDXGIOutput1 *dxgiOutput1 = nullptr;
        dxgiOutput->QueryInterface(__uuidof(IDXGIOutput1), (void **)&dxgiOutput1);

        IDXGIOutputDuplication *duplication = nullptr;
        hr = dxgiOutput1->DuplicateOutput(d3dDevice, &duplication);
        if (FAILED(hr))
        {
            std::cerr << "Failed to duplicate output" << std::endl;
            return;
        }

        DXGI_OUTDUPL_FRAME_INFO frameInfo;
        IDXGIResource *desktopResource = nullptr;

        while (running_)
        {
            hr = duplication->AcquireNextFrame(500, &frameInfo, &desktopResource);
            if (hr == DXGI_ERROR_WAIT_TIMEOUT)
                continue;
            if (FAILED(hr))
                break;

            ID3D11Texture2D *desktopImage = nullptr;
            if (desktopResource)
            {
                desktopResource->QueryInterface(__uuidof(ID3D11Texture2D), (void **)&desktopImage);
            }
            if (!desktopImage)
            {
                duplication->ReleaseFrame();
                continue;
            }

            D3D11_TEXTURE2D_DESC desc;
            desktopImage->GetDesc(&desc);

            ID3D11Texture2D *stagingTex = nullptr;
            desc.Usage = D3D11_USAGE_STAGING;
            desc.BindFlags = 0;
            desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
            desc.MiscFlags = 0;

            d3dDevice->CreateTexture2D(&desc, nullptr, &stagingTex);
            d3dContext->CopyResource(stagingTex, desktopImage);

            D3D11_MAPPED_SUBRESOURCE mapped;
            d3dContext->Map(stagingTex, 0, D3D11_MAP_READ, 0, &mapped);

            FrameData frame;
            frame.data = (uint8_t *)mapped.pData;
            frame.width = desc.Width;
            frame.height = desc.Height;
            frame.stride = mapped.RowPitch;
            frame.size = mapped.RowPitch * desc.Height;
            frame.timestamp = std::chrono::duration_cast<std::chrono::microseconds>(
                                  std::chrono::steady_clock::now().time_since_epoch())
                                  .count();

            callback_(frame);
            d3dContext->Unmap(stagingTex, 0);

            stagingTex->Release();
            desktopImage->Release();
            desktopResource->Release();
            duplication->ReleaseFrame();
        }

        duplication->Release();
        dxgiOutput1->Release();
        dxgiOutput->Release();
        dxgiAdapter->Release();
        dxgiDevice->Release();
        d3dContext->Release();
        d3dDevice->Release();
    }
};

extern "C" Capture *CreateCapture()
{
    return new WindowsCapture();
}
