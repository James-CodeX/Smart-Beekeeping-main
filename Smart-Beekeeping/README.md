# Smart-Beekeeping

A web application for beekeepers to monitor and manage their hives using IoT sensors.

## Environment Configuration

The application uses environment variables for configuring connections to external services like Supabase. These variables are stored in a `.env` file for local development or configured in Netlify for deployment.

### Setting up the .env file for Local Development

1. Create a `.env` file in the `/app` directory 
2. Add the following configuration variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Other configuration variables can be added here
```

3. Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase project details.

## Deploying to Netlify

This project has been adapted to deploy easily on Netlify. Follow these steps:

1. **Create a Netlify Account**:
   - Sign up at [netlify.com](https://netlify.com) if you don't have an account.

2. **Connect to GitHub**:
   - From the Netlify dashboard, click "New site from Git"
   - Select GitHub and authorize Netlify
   - Choose this repository

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - These settings are already configured in the `netlify.toml` file

4. **Set Environment Variables**:
   - In Netlify dashboard, go to Site settings > Build & deploy > Environment
   - Add the following environment variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

5. **Deploy**:
   - Click "Deploy site"

### Netlify Deployment Notes

- PHP functionality has been replaced with static JavaScript files for Netlify compatibility
- `env.js` is generated during build to contain your Supabase credentials from Netlify environment variables
- For local development, continue using the `.env` file approach

## Security Notes

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