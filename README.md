# Quest Day - Daily Quest Tracker

A gamified daily quest tracking application built with React, TypeScript, and Vercel infrastructure. Transform your daily tasks into engaging quests with XP, levels, and achievements.

## Features

- **Quest Management**: Create, assign, and track daily quests
- **Gamification**: Earn XP, level up, and maintain streaks
- **Admin Dashboard**: Manage users and assign quests
- **Multi-User Support**: Separate user profiles with personalized quests
- **Data Persistence**: Powered by Vercel Blob Storage
- **Modern UI**: Built with shadcn-ui and Tailwind CSS

## Technology Stacknh

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn-ui, Radix UI, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Vercel Blob Storage
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm or yarn package manager
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd quest-day-quest-vercel
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
```sh
cp .env.local.example .env.local
```

4. Configure your environment variables in `.env.local`:
```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

5. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run setup:blob-store` - Initialize Vercel Blob Storage
- `npm run test:blob-store` - Test Blob Storage connection
- `npm run blob:health` - Check Blob Storage health

## Project Structure

```
quest-day-quest-vercel/
├── api/                      # Vercel serverless functions
│   └── blob/                # API endpoints
│       └── admin/           # Admin management endpoints
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn-ui components
│   │   └── quest-system/   # Quest-related components
│   ├── lib/                # Utility functions and services
│   └── data/               # Static data and templates
├── public/                  # Static assets
└── scripts/                # Utility scripts

```

## Admin Dashboard

Access the admin dashboard to:
- Create and manage users
- Assign quests to users
- Modify user stats and levels
- Track user progress

Default admin credentials are configured via environment variables.

## API Endpoints

### Admin Endpoints
- `POST /api/blob/admin/create-user` - Create a new user
- `POST /api/blob/admin/modify-user` - Update user information
- `POST /api/blob/admin/delete-user` - Delete a user
- `POST /api/blob/admin/assign-tasks` - Assign quests to users

### User Endpoints
- `GET /api/blob/users-new` - Get all users
- `GET /api/blob/quests-new` - Get quest templates
- `POST /api/blob/auth` - Authenticate admin access

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```sh
npm install -g vercel
```

2. Deploy:
```sh
vercel
```

3. Configure environment variables in Vercel dashboard:
   - `BLOB_READ_WRITE_TOKEN`

### Automatic Deployments

Connect your repository to Vercel for automatic deployments on every push to main branch.

## Environment Variables

Required environment variables:

- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage access token
- `BLOB_STORE_PRIMARY_PATH` - Primary data path (optional)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on the GitHub repository.
