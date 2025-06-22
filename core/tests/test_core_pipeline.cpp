#include "../src/main.cpp"
#include <iostream>

int main() {
    std::cout << "[TEST] Running core pipeline test..." << std::endl;
    // Just call the main function to exercise the pipeline
    int result = ::main(0, nullptr);
    if (result == 0) {
        std::cout << "[TEST] Core pipeline test PASSED." << std::endl;
    } else {
        std::cout << "[TEST] Core pipeline test FAILED with code: " << result << std::endl;
    }
    return result;
}
