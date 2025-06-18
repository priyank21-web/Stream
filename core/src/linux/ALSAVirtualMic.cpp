#include <alsa/asoundlib.h>
#include <iostream>

class ALSAVirtualMic {
public:
    ALSAVirtualMic(const std::string& device) : deviceName_(device), handle_(nullptr) {}

    bool Open() {
        int rc = snd_pcm_open(&handle_, deviceName_.c_str(), SND_PCM_STREAM_PLAYBACK, 0);
        if (rc < 0) {
            std::cerr << "Unable to open PCM device: " << snd_strerror(rc) << std::endl;
            return false;
        }
        snd_pcm_set_params(handle_,
                           SND_PCM_FORMAT_S16_LE,
                           SND_PCM_ACCESS_RW_INTERLEAVED,
                           2, 44100, 1, 500000); // 0.5 sec latency
        return true;
    }

    bool Write(const int16_t* buffer, size_t frames) {
        int rc = snd_pcm_writei(handle_, buffer, frames);
        if (rc < 0) {
            snd_pcm_prepare(handle_);
            std::cerr << "ALSA write error: " << snd_strerror(rc) << std::endl;
            return false;
        }
        return true;
    }

    void Close() {
        if (handle_) snd_pcm_close(handle_);
        handle_ = nullptr;
    }

    ~ALSAVirtualMic() {
        Close();
    }

private:
    std::string deviceName_;
    snd_pcm_t* handle_;
};
