# YOUVA-EdAI — N8 Environment Reproducibility Guide

## 1. Reproducibility Mandate

In accordance with N8 acceptance criteria (N8.4), a verifier must be able to reproduce the system from source in a clean environment without relying on undocumented developer-local state.

```
Clean Machine / Container
           ↓
Checkout Exact SHA (cce7ef0)
           ↓
Install Locked Dependencies (npm ci)
           ↓
Start PostgreSQL 16 & Redis 7
           ↓
Run Database Migrations & Seeds
           ↓
Start Backend (NestJS :4000) & Frontend (Next.js :3000)
           ↓
Run Automated Health Probes
```

---

## 2. Prerequisites & Verified Toolchain Versions

Ensure the following runtimes are installed on the verification host:

* **Node.js**: `v20.12.0` (LTS) or higher
* **npm**: `v10.5.0` or higher
* **Docker / Docker Compose**: `v24.0.0` or higher (for PostgreSQL 16 & Redis 7)
* **Git**: `v2.40.0` or higher

---

## 3. Step-by-Step Clean Reproduction Procedure

### Step 1: Clone and Checkout the Frozen Release Candidate
```bash
git clone https://github.com/SahilKhutey/YOUVA-EdAi.git
cd YOUVA-EdAi
git checkout cce7ef080320e6fb944cd543dd665b4ab4f04693
```

Verify the working tree is clean and matches the recorded SHA:
```bash
git rev-parse HEAD
# Output must be: cce7ef080320e6fb944cd543dd665b4ab4f04693
```

### Step 2: Install Locked Dependencies
Install dependencies strictly from `package-lock.json` without modifying lockfiles:
```bash
# Backend dependencies
cd backend
npm ci
cd ..

# Frontend dependencies
cd frontend
npm ci
cd ..
```

### Step 3: Infrastructure Container Launch
Start isolated PostgreSQL and Redis instances:
```bash
docker compose up -d postgres redis
```

Or run standalone containers if docker compose is not used:
```bash
docker run -d --name youva-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=youva_edai -p 5432:5432 postgres:16-alpine
docker run -d --name youva-redis -p 6379:6379 redis:7-alpine
```

### Step 4: Configure Approved Verification Environment
Create `backend/.env` with standard test parameters:
```ini
NODE_ENV=test
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/youva_edai?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="youva_n8_verification_jwt_secret_must_be_long_and_secure_min_32_bytes"
JWT_EXPIRATION="3600s"
HMAC_AUDIT_SECRET="youva_n8_cryptographic_audit_ledger_hmac_secret_key_32_bytes"
AI_PROVIDER_DEFAULT="gemini"
GEMINI_API_KEY="mock-or-valid-gemini-key"
ENABLE_FALLBACK=true
```

Create `frontend/.env.local`:
```ini
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="youva_frontend_nextauth_verification_secret_32_chars"
```

### Step 5: Database Migration & Pilot Data Seeding
Run Prisma migrations and database seed:
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
cd ..
```

The seed command populates the two isolated test tenants:
* **Tenant A**: `tenant-default` (Delhi Public School, R.K. Puram)
* **Tenant B**: `tenant-modern-vv` (Modern School, Vasant Vihar)
* 60 Grade 8 CBSE Mathematics items across Rational Numbers and Linear Equations.

### Step 6: Build Verification
Execute strict compilation across both applications:
```bash
# Backend compilation
cd backend
npm run build
cd ..

# Frontend compilation
cd frontend
npm run build
cd ..
```

Both builds must complete with exit code 0.

### Step 7: System Launch & Dependency Health Probes
Start the backend and frontend:
```bash
# Terminal 1: Backend
cd backend && npm run start:prod

# Terminal 2: Frontend
cd frontend && npm run start
```

Verify backend health endpoints:
```bash
curl -f http://localhost:4000/health
# Response: {"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}}}

curl -f http://localhost:4000/metrics
# Response: Prometheus text format containing 22 operational telemetry signals
```

Verify frontend readiness:
```bash
curl -I http://localhost:3000
# Response: HTTP/1.1 200 OK
```

---

## 4. Reproducibility Acceptance Criteria

A verification run is accepted as reproducible if and only if:
1. Exact commit SHA matches `cce7ef080320e6fb944cd543dd665b4ab4f04693`.
2. Clean `npm ci` completes with zero audit warnings or unresolved peer dependencies.
3. Database migrations apply deterministically to an empty database without manual schema patches.
4. Health probes report all dependencies `up`.
5. Automated test suites pass without requiring pre-existing database rows outside of `seed.ts`.
