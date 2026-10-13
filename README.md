# Organ Connect (MERN)

Organ Connect is a React application backed by an Express API and MongoDB. It includes donor profiles, donor search, account registration and login, public requests, and an account dashboard.

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB connection string

## Run locally

1. Install dependencies from the project root: `npm install` and `npm --prefix client install`.
2. Copy `.env.example` to `.env` and set `SESSION_SECRET` and `MONGODB_URI`.
3. Start both applications with `npm run dev`.
4. Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The Express API runs on port 5000.

For a production build, run `npm run build`, set `NODE_ENV=production`, then run `npm start`. Express serves the built React app and API from the same origin.

Passwords are stored as bcrypt hashes. Login state uses an HTTP-only session cookie, and request deletion is restricted to the account that created the request. Configure HTTPS and a strong secret before deploying.

## Deploy on Render

1. Create a MongoDB Atlas cluster and obtain its connection string. Allow your Render service to connect in the Atlas network access settings.
2. In Render, create a Blueprint from this GitHub repository and select `render.yaml`.
3. When prompted, set `MONGODB_URI` to the Atlas connection string. Render generates `SESSION_SECRET` and builds and starts the app.
4. Open the service URL shown by Render. The React app and API are served from the same origin.

GitHub Pages cannot run this app's Express API or MongoDB-backed features; deploy the full-stack service on a Node.js host such as Render.
