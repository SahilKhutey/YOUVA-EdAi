# Youva EdAi - AI-Powered Learning Platform

Youva EdAi is an advanced, localized, AI-driven educational platform designed to personalize learning for students aged 12-24. It leverages Generative AI (Google Gemini) to provide real-time tutoring, adaptive practice quizzes, and personalized revision schedules.

## 🚀 Features

-   **AI-Powered Tutoring**: Interactive, structured learning sessions with immediate feedback.
-   **Adaptive Practice**: Quizzes that adjust difficulty based on performance.
-   **Knowledge Tracking**: Real-time mastery tracking per subject and topic.
-   **Revision Engine**: Automated suggestions for topics needing review (Spaced Repetition).
-   **Smart Analytics**: Visualizations of learning progress and mastery (Radar Charts, Activity Logs).
-   **Gamified Experience**: Progress bars, completion badges, and streak tracking.

## 🛠️ Technology Stack

### Backend
-   **Framework**: [NestJS](https://nestjs.com/)
-   **Language**: TypeScript
-   **Database**: SQLite (Dev) / PostgreSQL (Prod) via [Prisma ORM](https://www.prisma.io/)
-   **AI**: Google Gemini API (`@google/generative-ai`)
-   **Auth**: JWT & BCrypt
-   **Docs**: Swagger UI

### Frontend
-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Styling**: Tailwind CSS
-   **State/Fetch**: React Context & Axios
-   **Charts**: Recharts
-   **Animations**: Framer Motion

---

## 🏁 Getting Started

### Prerequisites
-   Node.js (v18+)
-   npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/youva-edai.git
cd youva-edai
```

### 2. Backend Setup
```bash
cd backend
npm install

# Environment Keys
# Create a .env file with:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-secret"
# GEMINI_API_KEY="your-gemini-key"
# PORT=3001  <-- Important: Run backend on 3001 to avoid conflict with Frontend (3000)

# Database Init
npx prisma migrate dev --name init
npx prisma db seed

# Run Server
npm run start:dev
# API available at http://localhost:3001
# Swagger Docs at http://localhost:3001/api
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Environment Keys
# Create a .env.local file with:
# NEXT_PUBLIC_API_URL="http://localhost:3001"

# Run Client
npm run dev
# App available at http://localhost:3000
```

## 🧪 Testing

```bash
# Backend Unit Tests
cd backend
npm run test

# Backend E2E Tests
npm run test:e2e
```

## 📄 License
This project is licensed under the MIT License.
