# Smart Nyuki - Intelligent Beekeeping Management System 🐝

![Smart Nyuki Logo](app/assets/img/smart-nyuki-logo.png)

## Overview

Smart Nyuki is a modern, web-based beekeeping management system that helps beekeepers monitor and manage their hives using IoT technology. The name "Nyuki" means "bee" in Swahili, reflecting the project's goal of making beekeeping smarter and more accessible.

## Features ✨

- **Real-time Monitoring**
  - Temperature tracking
  - Humidity monitoring
  - Weight measurement
  - Sound level analysis
  - Signal strength (RSSI) monitoring

- **Multi-Apiary Management**
  - Add and manage multiple apiaries
  - Track hives across different locations
  - Organize hives efficiently

- **Smart Alerts**
  - Temperature threshold alerts
  - Humidity level warnings
  - Weight change notifications
  - Customizable alert settings
  - 3-hour cooldown for similar alerts

- **Data Visualization**
  - Historical data tracking
  - Interactive charts and graphs
  - Trend analysis
  - Data export capabilities

- **User Management**
  - Secure authentication
  - Profile management
  - Role-based access control
  - Email notifications

## Technology Stack 🛠️

- **Frontend**
  - HTML5, CSS3, JavaScript
  - Bootstrap 5
  - Font Awesome 5
  - Chart.js for data visualization

- **Backend**
  - Supabase for authentication and database
  - Real-time data capabilities
  - Secure API endpoints

- **IoT Integration**
  - ESP32 microcontroller support
  - Multiple sensor integration
  - Real-time data transmission

## Getting Started 🚀

### Prerequisites

- Web browser (Chrome, Firefox, Safari, Edge)
- ESP32 development board (for hardware integration)
- Supabase account for backend services

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smart-nyuki.git
   ```

2. Navigate to the project directory:
   ```bash
   cd smart-nyuki
   ```

3. Open `app/index.html` in your web browser or set up a local server:
   ```bash
   python -m http.server 8000
   ```

4. Configure your Supabase credentials in `app/assets/js/auth.js`:
   ```javascript
   const SUPABASE_URL = 'your-supabase-url'
   const SUPABASE_ANON_KEY = 'your-anon-key'
   ```

### Hardware Setup

1. Flash your ESP32 with the provided firmware
2. Configure WiFi credentials
3. Set up sensors according to the wiring diagram
4. Register your device using the node ID in the web interface

## Project Structure 📁

```
smart-nyuki/
├── app/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── img/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── ...
├── docs/
├── hardware/
└── README.md
```

## Security Features 🔒

- Secure authentication using Supabase
- Row Level Security (RLS) policies
- Data encryption
- API key protection
- Cross-Origin Resource Sharing (CORS) configuration
- Regular security updates

## Contributing 🤝

We welcome contributions to Smart Nyuki! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 👏

- Thanks to all contributors who have helped shape Smart Nyuki
- Special thanks to the beekeeping community for valuable feedback
- Inspired by traditional beekeeping practices and modern technology

## Contact 📧

- Project Link: [https://github.com/yourusername/smart-nyuki](https://github.com/yourusername/smart-nyuki)
- Website: [https://smart-nyuki.com](https://smart-nyuki.com)

## Support 💪

If you find this project helpful, please give it a ⭐️! 
