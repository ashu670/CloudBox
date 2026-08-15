# 📦 CloudBox — Distributed Cloud Storage Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MinIO](https://img.shields.io/badge/MinIO-S3_Storage-C72C48?style=for-the-badge&logo=minio&logoColor=white)](https://min.io/)

> **CloudBox** is a high-performance, distributed cloud storage & collaboration platform inspired by Google Drive, Dropbox, and GitHub permission models. Built with **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL**, **MinIO Object Storage**, and **React 19**.

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

### ☁️ Enterprise S3 Object Storage (MinIO Integration)
- High-throughput file uploads and streaming downloads powered by **MinIO**.
- Automatic MIME-type detection and object key generation with collision prevention.

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
    Service --> Storage[MinIO Object Storage Service]
    Service --> Repository[Repositories]
    Repository -->|Prisma Client| DB[(PostgreSQL Database)]
    Storage -->|S3 Protocol| MinIO[(MinIO Object Storage)]
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, React Router 7, Axios, Oxlint, Vanilla CSS Design System |
| **Backend** | Node.js (ES Modules), Express 5.x, Passport.js (Google OAuth2), JWT, Multer |
| **Database** | PostgreSQL 16+, Prisma ORM 7.x |
| **Object Storage** | MinIO (S3-compatible Object Storage Service) |
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
- **PostgreSQL** (v16 or higher)
- **MinIO Server** (or Docker container)

---

### 1. Database Setup (PostgreSQL)
Create a new PostgreSQL database for CloudBox:
```sql
CREATE DATABASE cloudbox;
```

---

### 2. Object Storage Setup (MinIO)
Run MinIO using Docker:
```bash
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```
Create a bucket named `cloudbox-storage` in your MinIO console at `http://localhost:9001`.

---

### 3. Backend Setup

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
   DATABASE_URL="postgresql://postgres:Password123@localhost:5432/cloudbox"

   JWT_SECRET="cloudbox_access_secret_key"
   JWT_SECRET_REF="cloudbox_refresh_secret_key"

   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SEC="your-google-client-secret"
   GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"
   FRONTEND_URL="http://localhost:5173"

   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=cloudbox-storage
   MINIO_USE_SSL=false
   ```

4. **Run Prisma Migrations**:
   ```bash
   npx prisma migrate dev --name init
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
| `POST` | `/api/file/upload` | Upload file to MinIO storage | ✅ |
| `GET` | `/api/file/download/:id` | Stream/download file from MinIO | ✅ |
| `PATCH`| `/api/file/rename/:id` | Rename file | ✅ |
| `PATCH`| `/api/file/move/:id/:pid` | Move file to target folder | ✅ |
| `DELETE`| `/api/file/delete/:id` | Remove file metadata & MinIO object | ✅ |

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
