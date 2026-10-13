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
