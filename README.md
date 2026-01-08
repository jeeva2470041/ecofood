EcoFood Backend

Quick start:

- copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`
- run `npm install` in the `backend` folder
- start dev server with `npm run dev`

API endpoints (high level):
- POST `/api/auth/register` - register user with `role` set to `donor` or `ngo`
- POST `/api/auth/login` - login returns JWT
- POST `/api/foods` - donor posts food (protected)
- GET `/api/foods/nearby?lat=...&lng=...&radiusKm=5` - NGO fetch nearby
- POST `/api/foods/:id/claim` - NGO claims
- POST `/api/foods/:id/verify` - donor verifies pickup
- GET `/api/foods/impact/stats` - impact dashboard

---

Docker (quick):

- Build and run (single command):

  ```bash
  docker compose up --build
  ```

- Notes:
  - Backend expects a local `backend/.env` (copy `backend/.env.example`). **Do not commit** `.env` files.
  - Mongo is provided by the `mongo` service in `docker-compose.yml`.
  - For frontend in production we use an Nginx image to serve the built assets.

See the repository `docker-compose.yml` at the repo root for service configs.
