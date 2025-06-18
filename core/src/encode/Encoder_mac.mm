#import "Encoder.h"
#import <VideoToolbox/VideoToolbox.h>
#import <Foundation/Foundation.h>

class VTEncoder : public Encoder {
public:
    VTEncoder() : session(nullptr) {}
    ~VTEncoder() { Stop(); }

    bool Start(int width, int height, int fps, EncodedCallback cb) override {
        callback = cb;

        OSStatus status = VTCompressionSessionCreate(NULL, width, height,
                                                      kCMVideoCodecType_H264, NULL,
                                                      NULL, NULL,
                                                      CompressionCallback,
                                                      this, &session);
        if (status != noErr) return false;

        VTSessionSetProperty(session, kVTCompressionPropertyKey_RealTime, kCFBooleanTrue);
        VTSessionSetProperty(session, kVTCompressionPropertyKey_ProfileLevel, kVTProfileLevel_H264_High_AutoLevel);
        VTSessionSetProperty(session, kVTCompressionPropertyKey_MaxKeyFrameInterval, (__bridge CFTypeRef)@(fps));
        VTSessionSetProperty(session, kVTCompressionPropertyKey_ExpectedFrameRate, (__bridge CFTypeRef)@(fps));
        VTCompressionSessionPrepareToEncodeFrames(session);
        return true;
    }

    void EncodeFrame(const uint8_t* data, int stride) override {
        // Create CVPixelBuffer from raw data
        CVPixelBufferRef pixelBuffer = nullptr;
        CVPixelBufferCreate(kCFAllocatorDefault, width_, height_,
                             kCVPixelFormatType_32BGRA, NULL, &pixelBuffer);
        CVPixelBufferLockBaseAddress(pixelBuffer, 0);
        void* base = CVPixelBufferGetBaseAddress(pixelBuffer);
        memcpy(base, data, stride * height_);
        CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);

        CMTime pts = CMTimeMake(frameCount++, 30);
        VTCompressionSessionEncodeFrame(session, pixelBuffer, pts, kCMTimeInvalid, NULL, NULL, NULL);
        CFRelease(pixelBuffer);
    }

    void Stop() override {
        if (session) {
            VTCompressionSessionCompleteFrames(session, kCMTimeInvalid);
            VTCompressionSessionInvalidate(session);
            CFRelease(session);
            session = nullptr;
        }
    }

private:
    EncodedCallback callback;
    VTCompressionSessionRef session;
    int width_, height_;
    int frameCount = 0;

    static void CompressionCallback(void* outputCallbackRefCon,
                                     void* sourceFrameRefCon,
                                     OSStatus status,
                                     VTEncodeInfoFlags infoFlags,
                                     CMSampleBufferRef sampleBuffer) {
        if (!sampleBuffer) return;

        VTEncoder* encoder = (VTEncoder*)outputCallbackRefCon;
        if (!CMSampleBufferDataIsReady(sampleBuffer)) return;

        EncodedFrame encoded;
        encoded.timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer).value;

        CFArrayRef attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, false);
        bool isKeyFrame = false;
        if (attachments) {
            CFDictionaryRef dict = (CFDictionaryRef)CFArrayGetValueAtIndex(attachments, 0);
            isKeyFrame = !CFDictionaryContainsKey(dict, kCMSampleAttachmentKey_NotSync);
        }
        encoded.isKeyFrame = isKeyFrame;

        CMBlockBufferRef dataBuffer = CMSamp
