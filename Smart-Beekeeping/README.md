# Smart-Beekeeping

A web application for beekeepers to monitor and manage their hives using IoT sensors.

## Environment Configuration

The application uses environment variables for configuring connections to external services like Supabase. These variables are stored in a `.env` file in the app directory.

### Setting up the .env file

1. Create a `.env` file in the `/app` directory 
2. Add the following configuration variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Other configuration variables can be added here
```

3. Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase project details.

### Security Notes

- Never commit the `.env` file to version control
- Keep your API keys and other sensitive information secure
- For production deployment, use proper environment variable handling in your hosting environment

## Running the Application

1. Make sure your `.env` file is properly set up
2. Open the application in a local web server
3. Login or register to start using the application

## Features

- Real-time hive monitoring with temperature, humidity, and weight sensors
- Apiary management system
- Bee colony health tracking
- Alert system for critical conditions
- Mobile-responsive design

## Technical Details

- Frontend: HTML, CSS, JavaScript
- Backend: Supabase for authentication, database, and storage
- Sensors: ESP32-based IoT devices

## License

[Your License Information] 