## InternProj (dynamic CRUD)

This repo contains:

- **backend**: Node.js + TypeScript + Express + Prisma API that generates CRUD routes from `backend/src/config/appConfig.json`.
- **frontend**: Next.js UI that renders a dynamic table + form for any configured model.
- **shared**: sample config.

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

Backend runs on `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

