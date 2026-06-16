# Conditional Digital Vault

An experimental full-stack web application that allows users to create digital content governed by time-based, behavior-based, and rule-based conditions. Content undergoes irreversible state transitions based on immutable condition rules.

## 🎯 Key Features

- **Secure Authentication**: Email/password authentication with JWT tokens and bcrypt password hashing
- **Private Vaults**: Each user has a completely private vault - no public content
- **Digital Artifacts**: Create messages, memories, advice, confessions, or documents
- **Condition Types**:
  - **Time-Based**: Unlock after a specific date or duration
  - **Behavior-Based**: Unlock only after user manually confirms a milestone
  - **Inactivity-Based**: Trigger actions if user doesn't log in for a defined period
  - **Chained**: Multiple conditions that must be satisfied sequentially
- **Immutable Conditions**: Once created, conditions cannot be modified
- **Irreversible State Transitions**: 
  - `locked` → `visible` → `transformed` → `archived` → `destroyed`
  - Once destroyed, content cannot be recovered
  - Transformed content replaces the original permanently
- **State Engine**: Background process that evaluates conditions and triggers transitions
- **Audit Logging**: Complete audit trail of all state transitions
- **Notifications**: In-app alerts when conditions are met or states change

## 🏗️ Architecture

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT with bcrypt
- **State Engine**: node-cron for periodic condition evaluation

## 📁 Project Structure

```
conditional-digital-vault/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── models/          # Type definitions
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── services/        # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── artifact.service.ts
│   │   │   ├── condition-evaluator.service.ts
│   │   │   ├── state-engine.service.ts
│   │   │   └── notification.service.ts
│   │   └── server.ts        # Express server
│   ├── migrations/         # Database migrations
│   ├── seeds/              # Seed data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context (Auth)
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🚀 Getting Started

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

### Quick Start

1. **Backend**:
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

2. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```

3. **Access**: Open `http://localhost:3000` in your browser

## 🔐 Demo Credentials

After seeding the database:
- Email: `demo@example.com`
- Password: `demo123`

## 🎨 Design Philosophy

The system emphasizes:

- **Anticipation over Instant Gratification**: Locked content creates anticipation
- **Irreversibility**: State transitions are permanent, adding gravity to decisions
- **Transparency**: Users can see condition status without revealing content
- **Calm UX**: Subtle animations, intentional friction, clear warnings
- **Security**: All content is private by default, server-side validation

## 🔄 State Transitions

The system enforces strict state transition rules:

```
LOCKED → VISIBLE (when conditions met)
VISIBLE → TRANSFORMED (user action)
VISIBLE → ARCHIVED (user action)
VISIBLE → DESTROYED (user action)
TRANSFORMED → ARCHIVED (user action)
TRANSFORMED → DESTROYED (user action)
ARCHIVED → DESTROYED (user action)
DESTROYED → (no transitions, irreversible)
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Artifacts
- `GET /api/artifacts` - Get all user artifacts
- `GET /api/artifacts/:id` - Get specific artifact
- `POST /api/artifacts` - Create new artifact
- `GET /api/artifacts/:id/conditions` - Get artifact conditions
- `POST /api/artifacts/:id/satisfy-condition` - Satisfy behavior condition
- `POST /api/artifacts/:id/transition` - Manually transition state

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

## 🛠️ Development

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with demo data

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Protected API routes
- Server-side validation
- SQL injection prevention (parameterized queries)
- CORS configuration
- Content filtering based on state

## 📊 Database Schema

- **users**: User accounts with encrypted passwords
- **artifacts**: Digital content with metadata
- **conditions**: Immutable condition rules
- **state_transitions**: Audit trail of state changes
- **audit_logs**: General audit logging
- **notifications**: User notifications

## 🎯 Future Enhancements

Potential additions:
- Email notifications
- Advanced condition types
- Content encryption
- Export functionality
- Sharing capabilities (with conditions)
- Mobile app
- Analytics dashboard

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is an experimental project. Contributions and feedback are welcome!

## ⚠️ Important Notes

- This is an experimental system - use at your own risk
- State transitions are **irreversible** - test carefully
- Conditions are **immutable** after creation
- Destroyed content **cannot be recovered**
- Always backup your database in production
