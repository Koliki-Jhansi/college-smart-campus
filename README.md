# 🎓 CollegeHub — Smart Campus Collaboration & Student Services Platform

CollegeHub is an all-in-one, role-based smart campus collaboration and student services operating system. It unifies academic workflows, peer skill sharing, project team matchmaking, resource reservations, campus maintenance ticketing, lost-and-found tracking, event orchestration, and administrative telemetry into a single, cohesive platform.

---

## 🌟 Key Platform Modules

- **🤝 CampusConnect**: Peer-to-peer student and faculty networking with academic profiles, skills matching, and real-time private messaging.
- **🚀 ProjectHub**: Student project recruitment, collaborative workspace, milestone tracking, and faculty mentorship integration.
- **🔄 SkillSwap**: Reciprocal peer skill-trading engine with automated schedule coordination, video meeting links, and bilateral ratings.
- **📚 StudyHub**: Subject-focused study circles, peer review scheduling, and course-specific learning resources.
- **📅 CampusSlot**: Real-time smart reservation system for computer labs, AI research centers, seminar halls, and audio-visual equipment.
- **🛠️ CampusFix**: Maintenance ticketing system with SLA deadline tracking, photo verification, and technician dispatch boards.
- **🔍 CampusLost**: Campus lost-and-found registry featuring confidential identifying mark verification to prevent fraudulent claims.
- **🎉 EventHub**: Hackathons, workshops, and symposiums with digital ticketing, QR check-in, and automated participation certificates.
- **🏛️ ClubHub**: Student club recruitment, executive board rosters, member applications, and activity feeds.
- **🚌 CampusRide**: Live transit route timetables, pickup stop schedules, and bus maintenance status.
- **🗳️ CampusVoice**: Student suggestion and grievance portal with community upvoting and official administrative responses.
- **🔔 Real-time Notifications & Sockets**: Instant alerts for project requests, maintenance updates, booking approvals, and peer messages.

---

## 👥 Supported Roles & Access Control

CollegeHub implements strict **Role-Based Access Control (RBAC)** tailored to six distinct campus personas:

| Role | Target Users | Core Capabilities & Workflows |
| :--- | :--- | :--- |
| **Student** | Enrolled Undergrad / Postgrad Students | Join projects, swap skills, book resources, report issues, register for events, create study circles, chat with peers. |
| **Faculty** | Professors, HODs, Academic Advisors | Mentor student projects, advise academic clubs, review study groups, publish departmental notices. |
| **Admin** | Deans, Registrars, Campus Directors | Configure institution profile, manage departments/courses, review user registrations, export telemetry CSVs. |
| **Maintenance Staff** | Electricians, Plumbers, IT Technicians | Access the technician workboard, update ticket statuses, submit resolution proof photos and closure remarks. |
| **Transport Staff** | Fleet Supervisors, Bus Coordinators | Manage bus routes, update schedules, monitor vehicle status, publish transit advisories. |
| **Club Coordinator** | Student Club Leads, Society Presidents | Create campus events, review membership applications, post club announcements. |

---

## 💻 Technology Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **PDF & Certifications**: `jspdf`, `html2canvas`, `dompurify`
- **Real-Time Client**: [Socket.IO Client](https://socket.io/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/)
- **Database & ODM**: [MongoDB Atlas](https://www.mongodb.com/atlas) / [Mongoose 8](https://mongoosejs.com/)
- **Authentication**: JSON Web Tokens (JWT) + [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Real-Time Engine**: [Socket.IO Server](https://socket.io/)
- **Security & Headers**: [Helmet](https://helmetjs.github.io/), CORS, Express Rate Limiting
- **File Uploads & QR**: [Multer](https://github.com/expressjs/multer), [QRCode](https://www.npmjs.com/package/qrcode)

---

## 🏗️ Architecture & Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   React + Vite Web Client                   │
│         (Role-Based UI, Dashboards, Modals, Forms)          │
└────────────────┬────────────────────────────▲───────────────┘
                 │                            │
      REST APIs  │                 Socket.IO  │ Real-Time
    (HTTP / JSON)│                 WebSockets │ Notifications
                 ▼                            │ & Live Chat
┌─────────────────────────────────────────────┴───────────────┐
│                    Express.js REST Server                   │
│   (Auth Middleware, Controllers, RBAC, Validation, Sockets)  │
└────────────────┬────────────────────────────────────────────┘
                 │
      Mongoose   │ ODM Queries & Aggregations
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 MongoDB Atlas Database                      │
│ (Users, Profiles, Projects, Bookings, Tickets, Events, etc) │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: A free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) or a local MongoDB service.

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd collegehub
```

### 2. Configure Environment Variables

#### Backend (`server/.env`)
Copy the template in `server/.env.example` to create `server/.env`:
```bash
# Windows PowerShell:
Copy-Item server/.env.example server/.env

# Linux / macOS:
cp server/.env.example server/.env
```
Fill in your configuration in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/collegehub?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5175
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=15
```

#### Frontend (`client/.env`)
Copy the template in `client/.env.example` to create `client/.env`:
```bash
# Windows PowerShell:
Copy-Item client/.env.example client/.env

# Linux / macOS:
cp client/.env.example client/.env
```
Ensure the API endpoints point to your backend:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

### 3. Install Dependencies & Start the Servers

Open two terminal windows:

#### Terminal 1 — Backend Server:
```bash
cd server
npm install
npm run dev
```

#### Terminal 2 — Frontend Client:
```bash
cd client
npm install
npm run dev
```

The frontend will be accessible at `http://localhost:5175` (or `http://localhost:5174`), connected to the backend at `http://localhost:5000`.

---

## 🧪 Optional Realistic Demo Dataset (Development Only)

CollegeHub is built to work out-of-the-box with a completely empty database using the **First-Time College Setup Wizard**. However, for evaluation and testing, a full synthetic dataset is available:

### Seed Demo Data
```bash
cd server
npm run seed:demo
```
This initializes a fictional institution (**Andhra Institute of Engineering & Technology - AIET, Vijayawada**) with:
- 8 Engineering Departments & B.Tech Degree Programs
- 1 Administrator, 8 Faculty Members, 24 Students with complementary SkillSwap pairs
- 10 Campus Facilities, 8 Projects, 10 Maintenance Tickets, 6 Events, 5 Clubs, 4 Transit Routes

> **Demo Accounts Password**: `password123` (all synthetic test accounts)
> - **Admin**: `admin@demo.collegehub.local`
> - **Faculty HOD**: `faculty.cse1@demo.collegehub.local`
> - **Student Lead**: `student.cse01@demo.collegehub.local`
> - **Technician**: `staff.maint1@demo.collegehub.local`

### Reset Demo Data
To cleanly purge only synthetic demo data without touching legitimate user accounts:
```bash
cd server
npm run seed:demo:reset
```

---

## 🔄 Core Workflows

### 1. First-Time Setup & Dynamic Registration
1. When launched on a fresh database, visiting `/register` prompts: *"College setup has not been completed yet."*
2. Master Administrator registers via `/setup-admin` and completes the 6-Step Setup Wizard at `/admin/setup`.
3. The wizard stores custom Departments, Programs, and Facilities in MongoDB.
4. Subsequent student and faculty registrations dynamically pull live Department and Course ObjectIds from MongoDB.

### 2. Maintenance Lifecycle (`CampusFix`)
1. Student files a ticket with category, priority, and location.
2. Maintenance staff receives the ticket on the technician workboard based on discipline.
3. Technician updates status (`Accepted` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`) with resolution notes.
4. Student rates the service upon ticket closure; real-time dashboard metrics update immediately.

---

## 📁 Project Directory Structure

```
collegehub/
├── .gitignore                     # Root Git exclusion rules
├── README.md                      # Comprehensive project documentation
├── client/                        # React + Vite Frontend Application
│   ├── .env.example               # Frontend environment template
│   ├── index.html                 # Single page application entrypoint
│   ├── package.json               # Client dependencies & scripts
│   ├── tailwind.config.js         # Design tokens & color system
│   ├── vite.config.js             # Vite dev server & proxy rules
│   └── src/
│       ├── api/                   # Axios client & API module connectors
│       ├── components/            # Reusable UI components & layouts
│       ├── context/               # Auth, Socket, Toast, and Theme contexts
│       ├── pages/                 # Role dashboards, modules & setup wizard
│       └── routes/                # Protected routes & role navigation
└── server/                        # Node.js + Express Backend API
    ├── .env.example               # Backend environment template
    ├── package.json               # Server dependencies & scripts
    ├── server.js                  # Express app, Socket.IO & middleware initialization
    ├── config/                    # MongoDB connection & sanitized logging
    ├── controllers/               # Route logic & database controllers
    ├── middleware/                # JWT verification, RBAC, rate-limiting, audit
    ├── models/                    # 30+ Mongoose schemas & data models
    ├── routes/                    # Express REST route definitions
    ├── scripts/                   # Demo dataset seeder, reset & test scripts
    ├── sockets/                   # Real-time WebSocket event handlers
    ├── uploads/                   # Local file storage (.gitkeep protected)
    └── utils/                     # Token generators, CSV exporters, helpers
```

---

## 🔒 Security Best Practices

- **Zero Hardcoded Secrets**: All database credentials, secrets, and API endpoints are loaded via environment variables.
- **Strict `.gitignore` Enforcement**: Environment files (`.env`), build outputs (`dist/`), and dependency folders (`node_modules/`) are strictly excluded from Git.
- **Sanitized Database Logging**: Connection URIs mask sensitive database passwords in all console output.
- **Cryptographic Security**: Passwords hashed with `bcryptjs` (salt rounds: 10). Access tokens (JWT) and refresh tokens handle stateless authentication.
- **Header & Rate Protection**: Integrated `helmet` and `express-rate-limit` protect REST endpoints from brute-force and injection attacks.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
