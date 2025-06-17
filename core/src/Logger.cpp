#include "../include/Logger.h"
#include <iostream>
namespace stream {
void log_info(const std::string& msg) { std::cout << "[INFO] " << msg << std::endl; }
void log_error(const std::string& msg) { std::cerr << "[ERROR] " << msg << std::endl; }
}
