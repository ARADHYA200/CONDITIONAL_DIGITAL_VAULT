# Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- SQLite (included with Node.js) or PostgreSQL for production

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
DB_PATH=./data/vault.db
CORS_ORIGIN=http://localhost:3000
```

5. Run database migrations:
```bash
npm run migrate
```

6. Seed the database with demo data:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

The backend will be available at `http://localhost:3001`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Production Build

### Backend

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Frontend

1. Build for production:
```bash
npm run build
```

2. The built files will be in the `dist` directory. Serve them using a web server like nginx or serve them statically.

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `JWT_EXPIRES_IN`: Token expiration time
- `DB_PATH`: Path to SQLite database file
- `CORS_ORIGIN`: Allowed CORS origin for frontend

### Frontend
Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:3001/api
```

## Database

The system uses SQLite by default for development. For production, consider using PostgreSQL:

1. Install PostgreSQL
2. Create a database
3. Update the database configuration in `src/config/database.ts` to use PostgreSQL
4. Update migrations to use PostgreSQL syntax

## Security Considerations

1. **Change JWT_SECRET**: Use a strong, random secret in production
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS_ORIGIN to match your frontend domain
4. **Database**: Use a production-grade database (PostgreSQL) for production
5. **Environment Variables**: Never commit `.env` files to version control

## Demo Credentials

After running the seed script, you can use:
- Email: `demo@example.com`
- Password: `demo123`

Or:
- Email: `test@example.com`
- Password: `demo123`

## Troubleshooting

### Database errors
- Ensure the data directory exists and is writable
- Check file permissions on the database file

### CORS errors
- Verify CORS_ORIGIN matches your frontend URL
- Check that the backend is running

### Authentication errors
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure cookies/localStorage is enabled in the browser
