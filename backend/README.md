# Trippin Backend API

A complete backend API for the Trippin travel app built with Express.js and Supabase.

## Features

- 🔐 **Authentication**: Supabase Auth integration with email/password and Google OAuth
- 🗄️ **Database**: PostgreSQL with Supabase, complete schema with RLS policies
- 🚀 **API**: RESTful API with comprehensive CRUD operations
- 💳 **Payments**: Stripe integration for secure payments
- 🔒 **Security**: Rate limiting, CORS, helmet security headers
- 📱 **Real-time**: Supabase real-time subscriptions
- 🌍 **Multi-language**: Internationalization support

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: OpenAI integration
- **Security**: Helmet, CORS, Rate limiting

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Stripe account (for payments)

### 2. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

Update `.env` with your credentials:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development

# External API Keys
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

Run the database setup script to create tables and policies:

```bash
npm run setup
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/supabase-auth/signup` - User registration
- `POST /api/supabase-auth/signin` - User login
- `POST /api/supabase-auth/signin/google` - Google OAuth
- `POST /api/supabase-auth/signout` - User logout
- `GET /api/supabase-auth/user` - Get current user

### User Management
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/preferences` - Update user preferences
- `GET /api/auth/notifications` - Get user notifications

### Trips
- `GET /api/trips` - Get user trips
- `GET /api/trips/public` - Get public trips
- `GET /api/trips/:id` - Get trip details
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- `POST /api/trips/:id/favorite` - Add to favorites
- `POST /api/trips/:id/share` - Share trip

### Itineraries
- `GET /api/itineraries/trip/:tripId` - Get trip itineraries
- `POST /api/itineraries` - Create itinerary item
- `PUT /api/itineraries/:id` - Update itinerary item
- `DELETE /api/itineraries/:id` - Delete itinerary item

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments` - Get payment history
- `POST /api/payments/:id/refund` - Request refund

### Google Translate
- `POST /api/google-translate/translate` - Translate text
- `POST /api/google-translate/detect` - Detect language
- `GET /api/google-translate/languages` - Get supported languages

### Google Maps
- `POST /api/google-maps` - Get nearby places
- `POST /api/google-maps/details` - Get place details

## Database Schema

The database includes the following main tables:

- **users** - User profiles and authentication
- **trips** - Travel plans and itineraries
- **itineraries** - Detailed trip activities
- **bookings** - Travel bookings and reservations
- **payments** - Payment records and transactions
- **reviews** - User reviews and ratings
- **notifications** - User notifications
- **favorites** - User favorite trips

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configured for your frontend
- **Input Validation**: Request validation and sanitization
- **SQL Injection Protection**: Parameterized queries

## Development

### Project Structure

```
backend/
├── config/
│   └── supabase.js          # Supabase configuration
├── database/
│   └── schema.sql          # Database schema
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   ├── auth.js             # User management routes
│   ├── supabase-auth.js    # Supabase auth routes
│   ├── trips.js            # Trip management routes
│   ├── itineraries.js     # Itinerary routes
│   ├── bookings.js         # Booking routes
│   └── payments.js         # Payment routes
├── server.js               # Main server file
├── setup.js                # Database setup script
└── package.json
```

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run setup      # Setup database schema
npm test           # Run tests
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes (for payments) |
| `OPENAI_API_KEY` | OpenAI API key | Yes (for AI features) |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | No (for maps) |
| `GOOGLE_TRANSLATE_API_KEY` | Google Translate API key | No (for translation) |

## Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend directory
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Documentation

Visit `http://localhost:3001/` for API documentation and endpoint information.

## Support

For issues and questions:
1. Check the logs for error details
2. Verify environment variables are set correctly
3. Ensure Supabase project is properly configured
4. Check database permissions and RLS policies

## License

MIT License - see LICENSE file for details.
