#import "Capture.h"
#import <Foundation/Foundation.h>
#import <ScreenCaptureKit/ScreenCaptureKit.h>
#import <AVFoundation/AVFoundation.h>

@interface MacCaptureDelegate : NSObject <SCStreamOutput> {
@public
    Capture::FrameCallback callback;
}
@end

@implementation MacCaptureDelegate

- (void)stream:(SCStream *)stream didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer ofType:(SCStreamOutputType)type {
    if (type != SCStreamOutputTypeScreen) return;
    
    CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    CVPixelBufferLockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
    
    size_t width = CVPixelBufferGetWidth(imageBuffer);
    size_t height = CVPixelBufferGetHeight(imageBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
    void *baseAddress = CVPixelBufferGetBaseAddress(imageBuffer);
    
    FrameData frame;
    frame.data = (uint8_t*)baseAddress;
    frame.width = (int)width;
    frame.height = (int)height;
    frame.stride = (int)bytesPerRow;
    frame.size = bytesPerRow * height;
    frame.timestamp = std::chrono::duration_cast<std::chrono::microseconds>(
        std::chrono::steady_clock::now().time_since_epoch()).count();
    
    callback(frame);
    CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
}

@end

class MacCapture : public Capture {
public:
    MacCapture() : stream(nullptr), delegate(nil) {}
    ~MacCapture() { Stop(); }

    bool Start(FrameCallback cb) override {
        callback = cb;

        dispatch_semaphore_t sema = dispatch_semaphore_create(0);

        dispatch_async(dispatch_get_main_queue(), ^{
            SCShareableContent *content = [SCShareableContent shareableContentWithError:nil];
            SCDisplay *display = content.displays.firstObject;

            SCStreamConfiguration *config = [SCStreamConfiguration new];
            config.width = display.width;
            config.height = display.height;
            config.captureResolution = SCCaptureResolutionHigh;

            delegate = [MacCaptureDelegate new];
            delegate->callback = callback;

            stream = [[SCStream alloc] initWithFilter:display contentFilter:nil configuration:config delegate:delegate queue:dispatch_get_main_queue()];

            NSError *error;
            if (![stream startCaptureWithCompletionHandler:^(NSError * _Nullable error) {
                if (error) {
                    NSLog(@"Failed to start stream: %@", error);
                }
                dispatch_semaphore_signal(sema);
            }]) {
                dispatch_semaphore_signal(sema);
            }
        });

        dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
        return stream != nil;
    }

    void Stop() override {
        if (stream) {
            [stream stopCaptureWithCompletionHandler:^(NSError * _Nullable error) {}];
            stream = nil;
        }
    }

private:
    FrameCallback callback;
    SCStream *stream;
    MacCaptureDelegate* delegate;
};

extern "C" Capture* CreateCapture() {
    return new MacCapture();
}
