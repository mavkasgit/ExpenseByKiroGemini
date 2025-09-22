# Expense Tracker

A modern web application for tracking personal expenses built with Next.js 15, TypeScript, and Supabase.

## Features

- User authentication and authorization
- Multiple expense input methods (single entry, bulk table import)
- Automatic expense categorization with keyword matching
- Analytics and expense visualization
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 15 (App Router, Server Components, Server Actions)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **Integration**: MCP Supabase Server
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
expense-tracker/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth route group
│   │   ├── (dashboard)/         # Protected routes
│   │   └── auth/                # Auth confirmation
│   ├── components/              # Reusable components
│   │   ├── ui/                  # Base UI components
│   │   ├── forms/               # Form components
│   │   ├── expense-input/       # Expense input methods
│   │   ├── categorization/      # Auto-categorization components
│   │   ├── charts/              # Analytics components
│   │   └── layout/              # Layout components
│   ├── lib/                     # Utilities and configurations
│   │   ├── supabase/            # Supabase clients
│   │   ├── actions/             # Server Actions
│   │   ├── validations/         # Zod schemas
│   │   └── utils.ts
│   ├── types/                   # TypeScript definitions
│   └── middleware.ts            # Auth middleware
```

## Development

This project follows a spec-driven development approach. See the `.kiro/specs/expense-tracker/` directory for detailed requirements, design, and implementation tasks.

### Temporarily disabling authentication

The Edge middleware checks the Supabase session before allowing access to protected routes. To speed up development without going
through the login flow, set the `NEXT_PUBLIC_ENABLE_AUTH` environment variable to `true` only when authentication should be
enforced. When the variable is omitted (the default) the middleware will allow direct access to every page.

## License

This project is private and not licensed for public use.