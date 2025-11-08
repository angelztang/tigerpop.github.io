# TigerPop — Princeton community marketplace

TigerPop is a full-stack marketplace web application built for the Princeton community. It lets students buy and sell items (furniture, clothing, textbooks and more), manage listings, favorite items, and communicate interest — all with secure authentication and image uploads.

This repository contains a React + TypeScript frontend (in `frontend/`) and a Flask backend API (in `backend/`). The frontend is deployed as a static site and the backend runs as Python serverless functions (configured for Vercel in `vercel.json`).

## Notable features
- User authentication with CAS integration and JWT session tokens.
- Create, edit, search and filter listings with categories, price and condition.
- Image upload support via Cloudinary (secure image hosting and CDN).
- Listing “hearting” (favorites) and buyer/seller flows including email notifications.
- Responsive modern UI built with React, TypeScript and Tailwind CSS.
- RESTful API built with Flask, SQLAlchemy and PostgreSQL.

## Technology stack
- Frontend: React, TypeScript, Tailwind CSS, react-router.
- Backend: Flask, SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Flask-Mail.
- Database: PostgreSQL (production), SQLite for local dev.
- Uploads: Cloudinary for image storage and delivery.
- Auth: Princeton CAS integration + JWT for API auth.
- Deployment: Vercel for frontend + serverless Python API; Heroku (historical) examples remain in config.

## Quick start (development)
Prerequisites: Node.js (v18+ recommended), Python 3.10+, and a Postgres DB (or use SQLite locally).

1) Frontend

```bash
cd frontend
npm install
# start dev server
npm run dev
```

2) Backend (local)

```bash
# from repo root
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL='sqlite:///local.db'   # or your Postgres DATABASE_URL
export JWT_SECRET_KEY='your-secret'
export SECRET_KEY='your-secret'
python backend/run.py
```

Visit http://localhost:3000 for the frontend and http://localhost:8000 (or configured port) for backend routes.

## Environment variables (for Vercel / Production)
Set these in your Vercel project (Production + Preview environments). Build-time vars for CRA must be present before the build.

- DATABASE_URL — Postgres connection string (production DB).
- SECRET_KEY — Flask secret key.
- JWT_SECRET_KEY — JWT signing secret.
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET — Cloudinary creds.
- REACT_APP_API_URL — frontend build-time API URL (e.g. https://your-app.vercel.app/api)
- REACT_APP_FRONTEND_URL — frontend URL used for redirects.
- MAIL_SERVER, MAIL_PORT, MAIL_USE_TLS, MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER_EMAIL, MAIL_DEFAULT_SENDER_NAME — for outgoing mail.

## Deployment notes
- The repo contains `vercel.json` and a root `requirements.txt` so Vercel can build the frontend (`frontend/package.json`) and run the Python serverless API under `/api`.
- The backend is serverless-friendly and uses Cloudinary for all image storage — no local file persistence is required.
- Database migrations should be run outside of Vercel (e.g., from CI or a one-off machine) using Flask-Migrate/Alembic against the production DATABASE_URL.

## Developer notes & next steps
- The project is prepped to deploy both frontend and backend on Vercel. Before first deploy, add required env vars to the Vercel dashboard (see list above).
- I recommend storing Cloudinary `public_id` in the DB alongside image URLs for robust delete/update operations; currently the delete flow attempts to extract the public_id from the URL.
- If you want, I can add a health-check endpoint and a smoke-test that verifies DB connectivity and Cloudinary access during deployment.

## Contact / demo
If you'd like a live demo or specific feature walkthrough for recruiting purposes, let me know and I can deploy a demo instance or prepare a short video highlighting the UX and infrastructure.

---
Generated README summary — includes tech stack, features, run instructions, and deployment notes for recruiters and reviewers.


