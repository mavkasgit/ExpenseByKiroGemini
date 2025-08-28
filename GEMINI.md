# Gemini Code Assistant Context: Expense Tracker

This document provides a comprehensive overview of the Expense Tracker project to guide the Gemini Code Assistant.

## Project Overview

This is a modern web application for tracking personal expenses. It's built with Next.js 15 (App Router) and TypeScript, using Supabase for the backend. The application allows users to manage their expenses through various input methods, automatically categorizes them using a keyword-based system, and provides analytics and visualizations.

The project is under active development, with a detailed implementation plan tracked in `plan/tasks.md`.

### Key Features

-   User authentication (Sign up, Login, Password Reset).
-   Expense management (CRUD operations).
-   Multiple expense input methods: single entry, quick form, and bulk import from spreadsheets.
-   Automatic expense categorization based on user-defined keywords.
-   Management of categories and categorization keywords.
-   Dashboard with expense analytics and visualizations.

### Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **Backend & Database**: Supabase (PostgreSQL, Auth)
-   **Styling**: Tailwind CSS
-   **UI Components**: Custom components built with Radix UI principles (though not an explicit dependency).
-   **State Management**: Primarily uses React Server Components and Server Actions, with client-side state for UI interactivity.
-   **Validation**: Zod for schema validation.

## Building and Running

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Other Key Commands

-   **Build for Production:**
    ```bash
    npm run build
    ```
-   **Start Production Server:**
    ```bash
    npm run start
    ```
-   **Lint Files:**
    ```bash
    npm run lint
    ```

## Development Conventions

### Project Structure

The project follows a feature-oriented structure within the `src` directory.

-   `src/app`: Contains the Next.js App Router pages.
    -   `(auth)`: Route group for authentication pages.
    -   `(dashboard)`: Route group for protected dashboard pages.
-   `src/components`: Reusable React components, organized by feature (e.g., `expenses`, `categories`).
    -   `src/components/ui`: Base, generic UI components (e.g., `Button.tsx`, `Input.tsx`).
-   `src/lib`: Core logic, utilities, and configurations.
    -   `src/lib/actions`: Server Actions for backend operations (e.g., `expenses.ts`, `categories.ts`).
    -   `src/lib/supabase`: Supabase client instances for server-side and client-side code.
    -   `src/lib/validations`: Zod schemas for data validation.
-   `src/types`: TypeScript type definitions.
-   `migrations`: SQL migration files for the Supabase database.

### Coding Style

-   **TypeScript**: The project uses strict TypeScript.
-   **Server-Side Logic**: Business logic is primarily handled through Next.js Server Actions, located in `src/lib/actions`.
-   **Data Fetching**: Data is fetched within Server Components by directly calling the relevant Server Action.
-   **Components**: The project heavily favors Server Components for data fetching and rendering, passing data down to client-side components for interactivity.
-   **Styling**: Utility-first CSS with Tailwind CSS. `clsx` and `tailwind-merge` are used for conditional and merging classes.
-   **Path Aliases**: The project uses the `@/*` alias for imports from the `src` directory.

## Language Preference

**Always respond in Russian.**