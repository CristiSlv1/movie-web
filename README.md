# Movie Application

A full-stack web application for managing and reviewing movies, built with modern web technologies.

## Features

- 🎬 Movie browsing and searching
- ⭐ Movie ratings and reviews
- 👥 User authentication and authorization
- 🎭 Genre-based filtering
- 📊 Admin dashboard with statistics
- 🔒 Secure authentication with JWT
- 📝 User reviews and comments
- 🎨 Modern and responsive UI

## Tech Stack

### Frontend
- React
- TypeScript
- Material-UI
- React Router
- Axios for API calls

### Backend
- Node.js
- Express
- TypeScript
- TypeORM
- PostgreSQL
- JWT Authentication
- Faker.js for data generation

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Environment Variables

### Backend (.env)
```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=movie_db
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd movie-app
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## Database Setup

1. Create a PostgreSQL database named `movie_db`
2. The database schema will be automatically created when you start the backend server

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Access the application at `http://localhost:5173`

## Default Admin Account

After running the database population script, you can log in with these credentials:
- Email: user1@example.com
- Password: (hashed password in the database)

## API Endpoints

### Authentication
- POST `/api/register` - Register a new user
- POST `/api/login` - Login user

### Movies
- GET `/api/movies` - Get all movies (paginated)
- GET `/api/movies/:id` - Get movie by ID
- POST `/api/movies` - Create new movie (admin only)
- PUT `/api/movies/:id` - Update movie (admin only)
- DELETE `/api/movies/:id` - Delete movie (admin only)

### Reviews
- GET `/api/reviews` - Get all reviews
- POST `/api/reviews` - Create new review
- PUT `/api/reviews/:id` - Update review
- DELETE `/api/reviews/:id` - Delete review

### Users
- GET `/api/users` - Get all users (admin only)
- GET `/api/users/:id` - Get user by ID
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user (admin only)

## Database Population

The application includes a script to populate the database with sample data:
- 10 dummy users
- 5 movie genres
- 1000 movies
- 1000 reviews

To run the population script:
```bash
cd backend
npm run populate-db
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 