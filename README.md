# Team Task Manager

A modern, productivity-focused SaaS platform for managing projects, tasks, and team collaboration. Built with a sleek, dark-mode-first glassmorphism design.

## Features

- **Project Management**: Create and manage multiple projects with distinct statuses and deadlines.
- **Task Tracking**: Assign tasks, set priorities (Low, Medium, High, Critical), track statuses (To Do, In Progress, Done), and establish due dates.
- **Role-Based Access Control (RBAC)**: Enforces exactly one Admin per project (the creator), allowing only the Admin to modify project details, add members, or delete tasks.
- **Team Collaboration**: Add multiple members to projects and assign them specific tasks.
- **Audit Logging**: Automatically tracks and logs key actions like project creation, member additions, and task updates.
- **Modern UI/UX**: Features a premium dark mode, glassmorphism cards, micro-animations, and responsive dashboard analytics.

## Tech Stack

### Frontend
- **React** (via Vite)
- **CSS** (Vanilla CSS with custom properties for theme tokens)
- **Lucide React** (Icons)
- **Recharts** (Dashboard analytics)

### Backend
- **Node.js & Express**
- **TypeScript**
- **Prisma ORM**
- **SQLite / PostgreSQL** (via Prisma adapters)
- **JWT** (Authentication)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SISODIA2303/team-task-manager.git
   cd team-task-manager
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   # Configure your .env file with DATABASE_URL and JWT_SECRET
   npm run db:push
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Seed the Database (Optional):**
   To populate the database with sample users, projects, and tasks:
   ```bash
   cd backend
   npx tsx seed.ts
   ```

## Design Philosophy

The application follows a modern SaaS design language:
- **Colors**: Deep slate backgrounds (`#0F172A`) with Indigo (`#6366F1`) and Emerald (`#10B981`) accents.
- **Aesthetics**: Glassmorphism surfaces, subtle mesh gradients, and multi-layered shadows.
- **Typography**: Clean, readable interface using the `Inter` font family.

## License

This project is licensed under the MIT License.
