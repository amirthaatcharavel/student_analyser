# Deployment Guide — AI Student Performance Prediction System

This guide covers deploying all three services to production.

---

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- MongoDB Atlas account (or local MongoDB)
- Git
- Vercel CLI (`npm i -g vercel`)
- Render account

---

## 1. Database — MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster (M0 Shared)
3. Set up a database user with a strong password
4. Whitelist `0.0.0.0/0` in Network Access (for Render)
5. Get the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/studentperf?retryWrites=true&w=majority
   ```

---

## 2. ML API — Render (Python)

### Prepare

```bash
cd ml
pip install -r requirements.txt
python train.py   # generates model.pkl and label_encoder.pkl
```

### Deploy to Render

1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create a **New Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Name**: `student-perf-ml-api`
   - **Root Directory**: `ml`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Environment Variables**:
     - `PORT`: 5001

> **Important**: Make sure `model.pkl` and `label_encoder.pkl` are committed to the repo, or add the training step to the build command:
> ```
> pip install -r requirements.txt && python train.py
> ```

### Add gunicorn to requirements

Add `gunicorn` to `ml/requirements.txt` for production:
```
gunicorn==23.0.0
```

---

## 3. Backend API — Render (Node.js)

### Deploy to Render

1. Create a **New Web Service** on Render
2. Configure:
   - **Name**: `student-perf-backend`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `MONGO_URI`: Your Atlas connection string
     - `JWT_SECRET`: A strong random secret (use `openssl rand -hex 32`)
     - `FLASK_API_URL`: URL of your deployed ML API (e.g., `https://student-perf-ml-api.onrender.com`)
     - `PORT`: 5000

---

## 4. Frontend — Vercel

### Prepare

Update `client/src/services/api.js` to use the production backend URL:

```javascript
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
```

Create `client/.env.production`:
```
VITE_API_URL=https://student-perf-backend.onrender.com/api
```

### Deploy

```bash
cd client
npm run build    # Verify build succeeds locally
vercel           # Follow prompts
```

Or connect your GitHub repo to Vercel:
1. Import project in Vercel dashboard
2. Set root directory to `client`
3. Framework preset: Vite
4. Environment variables:
   - `VITE_API_URL`: `https://student-perf-backend.onrender.com/api`

---

## 5. Post-Deployment Checklist

- [ ] Test ML API health: `GET https://your-ml-api.onrender.com/health`
- [ ] Test Backend health: `GET https://your-backend.onrender.com/api/health`
- [ ] Register a new user on the frontend
- [ ] Make a test prediction
- [ ] Verify dashboard charts load
- [ ] Test CSV export and PDF download
- [ ] Test on mobile devices

---

## Local Development

### Start all services:

**Terminal 1 — ML API:**
```bash
cd ml
python app.py
# Runs on http://localhost:5001
```

**Terminal 2 — Backend:**
```bash
cd server
npm start
# Runs on http://localhost:5000
```

**Terminal 3 — Frontend:**
```bash
cd client
npm run dev
# Runs on http://localhost:3000
```

The Vite dev server proxies `/api` requests to `localhost:5000` automatically.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `ECONNREFUSED` on prediction | Ensure Flask API is running on port 5001 |
| MongoDB connection fails | Check `MONGO_URI` and network access settings |
| JWT token expired | Login again to get a new token |
| Tailwind styles missing | Run `npm run dev` to trigger PostCSS processing |
| Model not found | Run `python train.py` in the `ml/` directory |
