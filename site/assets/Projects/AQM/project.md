# Air Quality Monitor

**[View on GitHub](https://github.com/Tsquash/AirQualityMonitor)**

Air quality monitor is an embedded IoT device I designed in 2025 to measure and display indoor air quality metrics. The onboard ESP32C6 allows the data to be sent via Matter over WiFi to integrate with the user's smart home. The device is capable of measuring CO2, VOCs, NOx events, temperature, and relative humidity. Measured values, along with the current date and time, are shown on an e-paper display, and updated once per minute on the minute. This is done via an onboard RTC, and periodic NTP sync. Time is set automatically from WiFi credentials available after Matter commissioning, and timezone is set automatically from the `https://ipapi.co/utc_offset/` API. 
