#pragma once
#include <string>
#include <fstream>
#include <vector>
#include <functional>
#include <thread>
#include <chrono>
#include <cstdint>

class AudioRecorder {
public:
    using AudioFrameCallback = std::function<void(const std::vector<int16_t>&, uint64_t timestamp)>;

    AudioRecorder(int sampleRate, int channels)
        : sampleRate_(sampleRate), channels_(channels), recording_(false) {}

    void startRecording(const std::string& filename) {
        stopRecording();
        file_.open(filename, std::ios::binary);
        if (file_.is_open()) {
            writeWavHeader();
            recording_ = true;
            dataBytes_ = 0;
        }
    }

    void recordFrame(const int16_t* data, size_t samples, uint64_t timestamp) {
        if (recording_ && file_.is_open()) {
            file_.write(reinterpret_cast<const char*>(data), samples * sizeof(int16_t));
            dataBytes_ += samples * sizeof(int16_t);
        }
    }

    void stopRecording() {
        if (recording_ && file_.is_open()) {
            finalizeWavHeader();
            file_.close();
        }
        recording_ = false;
    }

    bool isRecording() const { return recording_; }

    static void playRecording(const std::string& filename, AudioFrameCallback callback, int sampleRate, int channels, int frameMs = 10) {
        std::ifstream file(filename, std::ios::binary);
        if (!file.is_open()) return;
        // Skip WAV header (44 bytes)
        file.seekg(44, std::ios::beg);
        size_t samplesPerFrame = sampleRate * channels * frameMs / 1000;
        std::vector<int16_t> buffer(samplesPerFrame);
        uint64_t timestamp = 0;
        while (file.read(reinterpret_cast<char*>(buffer.data()), samplesPerFrame * sizeof(int16_t))) {
            callback(buffer, timestamp);
            std::this_thread::sleep_for(std::chrono::milliseconds(frameMs));
            timestamp += frameMs;
        }
    }

private:
    int sampleRate_;
    int channels_;
    bool recording_;
    std::ofstream file_;
    size_t dataBytes_ = 0;

    void writeWavHeader() {
        // Write a placeholder WAV header (will update sizes on finalize)
        uint32_t byteRate = sampleRate_ * channels_ * 2;
        uint16_t blockAlign = channels_ * 2;
        file_.write("RIFF", 4);
        uint32_t chunkSize = 0; file_.write(reinterpret_cast<const char*>(&chunkSize), 4); // to be filled
        file_.write("WAVEfmt ", 8);
        uint32_t subchunk1Size = 16; file_.write(reinterpret_cast<const char*>(&subchunk1Size), 4);
        uint16_t audioFormat = 1; file_.write(reinterpret_cast<const char*>(&audioFormat), 2);
        file_.write(reinterpret_cast<const char*>(&channels_), 2);
        file_.write(reinterpret_cast<const char*>(&sampleRate_), 4);
        file_.write(reinterpret_cast<const char*>(&byteRate), 4);
        file_.write(reinterpret_cast<const char*>(&blockAlign), 2);
        uint16_t bitsPerSample = 16; file_.write(reinterpret_cast<const char*>(&bitsPerSample), 2);
        file_.write("data", 4);
        uint32_t dataChunkSize = 0; file_.write(reinterpret_cast<const char*>(&dataChunkSize), 4); // to be filled
    }
    void finalizeWavHeader() {
        if (!file_.is_open()) return;
        file_.seekp(4, std::ios::beg);
        uint32_t chunkSize = 36 + dataBytes_;
        file_.write(reinterpret_cast<const char*>(&chunkSize), 4);
        file_.seekp(40, std::ios::beg);
        uint32_t dataChunkSize = dataBytes_;
        file_.write(reinterpret_cast<const char*>(&dataChunkSize), 4);
    }
}; 