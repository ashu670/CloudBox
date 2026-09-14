# 📦 CloudBox — Distributed Cloud Storage Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> **CloudBox** is a high-performance, distributed cloud storage & collaboration platform inspired by Google Drive, Dropbox, and GitHub permission models. Built with **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL / Supabase**, **Docker**, and **React 19**.

---

## 🌟 Key Features

### 📁 Advanced Directory & File Management
- **Hierarchical Directory Tree**: Support for deeply nested folders, breadcrumb navigation, and real-time path calculations.
- **HTML5 Drag & Drop Moving System**: Drag files and subfolders directly onto sidebar tree nodes, table rows, or breadcrumb pills.
- **File Preview Modal**: Native in-browser streaming and rendering for:
  - 🖼️ **Images**: JPEG, PNG, GIF, SVG, WebP
  - 📄 **Documents**: PDF viewing via embedded frame
  - 🎥 **Video & Audio**: HTML5 video & audio player streaming
  - 💻 **Code & Text**: Code syntax display for JSON, JavaScript, Python, Markdown, HTML, and plain text files.

### 🔐 Granular Security & Permissions (Linux / GitHub Style)
- **Role-Based Access Control (RBAC)**:
  - `OWNER`: Full administrative control, invite code management, role assignment, and ownership transfer.
  - `ADMIN`: Manage folder members, approve/reject join requests, upload, edit, rename, move, and delete items.
  - `EDITOR`: Upload, edit, rename, and move files/folders.
  - `VIEWER`: Read-only access to view and download files.
- **Permission Service**: Decoupled $O(1)$ constant-time permission checking layer evaluating folder hierarchies.

### 🤝 Shared Folders & Collaboration Workflows
- **Invite Codes**: Unique, regenerable folder invite codes with toggleable active/inactive statuses.
- **Join Request Workflow**: Users submit join requests via invite codes; owners/admins approve or reject requests.
- **Ownership Transfer**: Folder owners can safely transfer full ownership to any existing folder admin.

### 📜 Comprehensive Audit Logging
- **Activity Log Service**: Centralized, immutable activity logging engine recording events across the entire lifecycle:
  - Folder creation, renaming, moving, deletion, and sharing.
  - File uploading, renaming, moving, and deletion.
  - Member join requests, approvals, rejections, role updates, and ownership transfers.

### ☁️ Enterprise Cloud Storage & Database (Supabase Integration)
- High-throughput file uploads, secure asset hosting, and streaming downloads powered by **Supabase**.
- Managed PostgreSQL database with connection pooling and high-availability reliability.
- Automatic MIME-type detection and object key generation with collision prevention.

### 🐳 Containerized Architecture & Deployment (Docker)
- Production-ready **Multi-Stage Dockerfile** for lean, secure builds:
  - **Stage 1 (Builder)**: Full dependency installation and Prisma client generation.
  - **Stage 2 (Prod-Deps)**: Native module compilation (`bcrypt`) and production-only dependencies.
  - **Stage 3 (Runtime)**: Minimal node:20-slim base with a dedicated non-root user (`appuser`).
- Ready for one-click deployments to container clouds like Render, Fly.io, or AWS ECS.

---

## 🏗️ System Architecture

CloudBox strictly adheres to **Clean Layered Architecture**. Repositories are the **ONLY** layer interacting with Prisma ORM and PostgreSQL. Services handle core domain business logic and never query the database directly.

```mermaid
graph TD
    Client[React 19 SPA Frontend] -->|REST API / Axios| Routes[Express Routes & Middleware]
    Routes --> Auth[JWT & Passport Auth]
    Routes --> Controller[Controllers]
    Controller --> Service[Business Logic Services]
    Service --> PermService[Permission & RBAC Service]
    Service --> Storage[Storage & Cloud Service]
    Service --> Repository[Repositories]
    Repository -->|Prisma Client| DB[(PostgreSQL / Supabase)]
    Storage -->|API Protocol| Supabase[(Supabase Storage)]
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, React Router 7, Axios, Oxlint, Vanilla CSS Design System |
| **Backend** | Node.js (ES Modules), Express 5.x, Passport.js (Google OAuth2), JWT, Multer |
| **Database** | PostgreSQL 16+, Supabase, Prisma ORM 7.x |
| **Object Storage** | Supabase Storage / Cloud Storage |
| **DevOps & Containers**| Docker (Multi-stage builds), Render |
| **Testing & Tools** | Jest, Supertest, Nodemon, Morgan, Pino Logging |

---

## 📊 Database Schema & Data Models

```mermaid
erDiagram
    User ||--o{ Folder : "owns"
    User ||--o{ File : "uploads"
    User ||--o{ FolderMember : "participates"
    User ||--o{ FolderJoinRequest : "requests"
    User ||--o{ ActivityLogs : "performs"
    
    Folder ||--o{ Folder : "children (nested)"
    Folder ||--o{ File : "contains"
    Folder ||--o{ FolderMember : "has members"
    Folder ||--o{ FolderJoinRequest : "receives requests"
    Folder ||--o{ ActivityLogs : "logs"

    User {
        int id PK
        string name
        string email UK
        string password
        enum provider "LOCAL | GOOGLE"
        enum role "USER | ADMIN"
    }

    Folder {
        int id PK
        string name
        int pid FK "parent folder"
        int uid FK "owner"
        boolean isShared
        string inviteCode UK
        boolean isInviteActive
        enum visibility "PRIVATE | PUBLIC"
    }

    File {
        int id PK
        string orgName
        string stoName UK
        string mimeType
        int size
        int folderId FK
        int uid FK
    }

    FolderMember {
        int id PK
        int folderId FK
        int userId FK
        enum role "OWNER | ADMIN | EDITOR | VIEWER"
    }

    FolderJoinRequest {
        int id PK
        int folderId FK
        int requestedBy FK
        enum status "PENDING | APPROVED | REJECTED"
    }

    ActivityLogs {
        int id PK
        int folderId FK
        int userId FK
        enum action
        enum target "FOLDER | FILE | MEMBER"
        string message
        datetime createdAt
    }
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (v20 or higher) & **npm**
- **PostgreSQL** (v16 or higher) or a **Supabase** account
- **Docker** (Optional, for containerized run)

---

### 1. Database & Cloud Setup (Supabase / PostgreSQL)

You can use a local PostgreSQL database or Supabase:

1. Create a project at [Supabase](https://supabase.com).
2. Retrieve your connection strings from **Project Settings > Database**:
   - **Transaction Pooler URL** (Port 6543) for runtime (`DATABASE_URL`).
   - **Direct / Session Pooler URL** (Port 5432) for migrations (`DIRECT_URL`).
3. Create your storage bucket named `cloudbox-storage` in the Supabase dashboard.

---

### 2. Docker Setup (Containerized Run)

CloudBox comes with a multi-stage `Dockerfile` in `Backend/`.

#### Build the Docker Image:
```bash
cd Backend
docker build -t cloudbox-backend .
```

#### Run the Container:
```bash
docker run -d -p 3000:3000 \
  --name cloudbox-backend \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-supabase-database-url" \
  -e DIRECT_URL="your-supabase-direct-url" \
  -e JWT_SECRET="cloudbox_access_secret_key" \
  -e JWT_SECRET_REF="cloudbox_refresh_secret_key" \
  -e FRONTEND_URL="http://localhost:5173" \
  cloudbox-backend
```

---

### 3. Backend Setup (Local Run)

1. **Navigate to the Backend directory**:
   ```bash
   cd Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside `Backend/`:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

   JWT_SECRET="cloudbox_access_secret_key"
   JWT_SECRET_REF="cloudbox_refresh_secret_key"

   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SEC="your-google-client-secret"
   GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"
   FRONTEND_URL="http://localhost:5173"

   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_KEY="your-supabase-anon-or-service-key"
   SUPABASE_BUCKET="cloudbox-storage"
   ```

4. **Run Prisma Migrations & Client Generation**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start Backend Server**:
   ```bash
   npm run dev
   ```
   The backend API server will start on `http://localhost:3000`.

---

### 4. Frontend Setup

1. **Navigate to the Frontend directory**:
   ```bash
   cd ../Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside `Frontend/`:
   ```env
   VITE_API_BASE_URL="http://localhost:3000"
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📡 Key REST API Endpoints

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user account | ❌ |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | ❌ |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | ✅ |
| `GET` | `/api/auth/google` | Initiate Google OAuth2 flow | ❌ |

### 📁 Folders (`/api/folder`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/folder/create` | Create a new private/shared folder | ✅ |
| `GET` | `/api/folder/fetch` | Get directory tree & folder items | ✅ |
| `PATCH`| `/api/folder/rename/:id` | Rename a folder | ✅ |
| `PATCH`| `/api/folder/move/:id/:pid` | Move folder to target parent | ✅ |
| `DELETE`| `/api/folder/delete/:id` | Delete folder & child contents | ✅ |
| `POST` | `/api/folder/join` | Request to join a folder via invite code | ✅ |
| `GET` | `/api/folder/requests/:folderId` | Get pending join requests | ✅ |
| `POST` | `/api/folder/approve-request` | Approve member join request | ✅ |
| `POST` | `/api/folder/reject-request` | Reject member join request | ✅ |

### 📄 Files (`/api/file`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/file/upload` | Upload file to cloud storage (Supabase) | ✅ |
| `GET` | `/api/file/download/:id` | Stream/download file from storage | ✅ |
| `PATCH`| `/api/file/rename/:id` | Rename file | ✅ |
| `PATCH`| `/api/file/move/:id/:pid` | Move file to target folder | ✅ |
| `DELETE`| `/api/file/delete/:id` | Remove file metadata & cloud storage object | ✅ |

### 📜 Activity Logs (`/api/activity`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/activity/:folderId` | Fetch chronological activity logs | ✅ |

---

## 🧪 Testing & Code Quality

Run tests and linters across the codebase:

```bash
# Backend Tests
cd Backend
npm test

# Frontend Linter & Build
cd Frontend
npm run lint
npm run build
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
