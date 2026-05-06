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

## Deployment (Railway)

This application is ready to be deployed on [Railway](https://railway.app/). Railway supports deploying monorepos by configuring the root directory for each service.

### Step 1: Create a Railway Account & Link GitHub
1. Go to [Railway.app](https://railway.app/) and sign up.
2. Link your GitHub account so Railway can access this repository.

### Step 2: Deploy the Database
1. Click **"New Project"** -> **"Provision PostgreSQL"**.
2. Railway will instantly create a PostgreSQL database. 
3. Click on the PostgreSQL service, go to the **Variables** tab, and copy the `DATABASE_URL`.

### Step 3: Deploy the Backend
1. Click **"New"** -> **"GitHub Repo"** and select your `team-task-manager` repository.
2. Once the service is created, go to **Settings**.
3. Under **Build**, set the **Root Directory** to `/backend`.
4. Go to the **Variables** tab and add the following:
   - `DATABASE_URL`: (Paste the URL from Step 2)
   - `JWT_SECRET`: (Create a secure random string)
   - `JWT_REFRESH_SECRET`: (Create another secure random string)
   - `NODE_ENV`: `production`
   - `PORT`: `8000`
5. Go back to **Settings**, scroll down to **Networking**, and click **"Generate Domain"**. Copy this URL (e.g., `https://backend-production-xxxx.up.railway.app`).

### Step 4: Deploy the Frontend
1. Click **"New"** -> **"GitHub Repo"** and select your `team-task-manager` repository again to create a second service.
2. Go to **Settings** for this new service.
3. Under **Build**, set the **Root Directory** to `/frontend`.
4. Go to the **Variables** tab and add:
   - `VITE_API_URL`: (Paste the backend URL generated in Step 3)
5. Go to **Settings** -> **Networking** and click **"Generate Domain"**. This will be your live application URL!

### Step 5: (Optional) Seed the Database in Production
If you want your sample data on the live site:
1. Go to your Backend service in Railway.
2. Open the **Command Palette** (Cmd/Ctrl + K) and select **"Execute Command"**.
3. Run `npm run db:push` to ensure the schema is updated.
4. Run `npx tsx seed.ts` to populate the database.

## Design Philosophy

The application follows a modern SaaS design language:
- **Colors**: Deep slate backgrounds (`#0F172A`) with Indigo (`#6366F1`) and Emerald (`#10B981`) accents.
- **Aesthetics**: Glassmorphism surfaces, subtle mesh gradients, and multi-layered shadows.
- **Typography**: Clean, readable interface using the `Inter` font family.

## License

This project is licensed under the MIT License.
