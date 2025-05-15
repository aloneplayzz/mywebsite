# AI Persona Chatroom

A full-stack web application for chatting with AI personas in different chatrooms.

## Features

- User authentication with Google, GitHub, and Discord OAuth
- Create and join chatrooms
- Chat with AI personas
- Create custom personas
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: Passport.js
- **AI Integration**: OpenAI API, Google Gemini API

## Deployment on Render

This project is configured for easy deployment on Render using the `render.yaml` file.

### One-Click Deployment

1. Fork this repository to your GitHub account
2. Sign up for [Render](https://render.com/)
3. Click "New" and select "Blueprint" from the dropdown
4. Connect your GitHub account and select this repository
5. Render will automatically detect the `render.yaml` file and set up your services
6. Add the required environment variables in the Render dashboard:
   - `SESSION_SECRET`
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
   - `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`

### Manual Deployment

If you prefer to set up manually:

1. Create a PostgreSQL database on Render
2. Create a Web Service pointing to this repository
3. Set the build command to `npm install`
4. Set the start command to `node index.js`
5. Add the environment variables listed above
6. Set the `DATABASE_URL` to your Render PostgreSQL Internal Database URL

### Update OAuth Callback URLs

After deployment, update your OAuth providers with the new callback URLs:

- Google: `https://your-app-name.onrender.com/api/auth/google/callback`
- GitHub: `https://your-app-name.onrender.com/api/auth/github/callback`
- Discord: `https://your-app-name.onrender.com/api/auth/discord/callback`

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables (see `.env.example`)
4. Run the development server: `npm run dev`

## API Endpoints

- `/api/hello` - Test endpoint
- `/api/db-status` - Check database connection status
- `/api/env` - View environment variables (safely)
- `/api/init-db` - Initialize the database
- `/api/auth/*` - Authentication endpoints
- `/api/chatrooms/*` - Chatroom management
- `/api/personas/*` - Persona management

## Troubleshooting

If you encounter issues with the deployment:

1. Check the Render logs for error messages
2. Verify all environment variables are set correctly
3. Ensure the database connection is working by visiting `/api/db-status`
4. Check that OAuth callback URLs are correctly configured

## License

MIT
