# Social App Backend

A robust and scalable backend API for a Social Media application, built with **Node.js**, **Express**, and **TypeScript**. 

**Author:** FAKHR

---

## 🚀 Features

- **Authentication & Authorization**: Secure user login and registration using JWT and bcrypt.
- **User Management**: Profile handling and user relationships.
- **Posts & Comments**: Create, read, update, and delete posts. Users can interact with posts through comments.
- **Push Notifications**: Integrated with **Firebase Admin SDK** for real-time notifications.
- **File Uploads**: Cloud storage integration with **AWS S3** for handling user media and profile pictures.
- **Caching & Performance**: Uses **Redis** for fast data retrieval and optimized performance.
- **GraphQL Integration**: Includes a GraphQL endpoint for flexible data querying alongside REST APIs.
- **Validation**: Schema-based request validation using **Zod**.
- **Security**: Implements `helmet` for HTTP headers security, `cors`, and `express-rate-limit` for preventing brute-force attacks.
- **Error Handling**: Centralized global error handling mechanism.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Caching**: Redis
- **API Architecture**: REST & GraphQL
- **Storage**: AWS S3
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Validation**: Zod
- **Security**: Helmet, CORS, Express-Rate-Limit, JWT, Bcrypt

## 📂 Project Structure

```text
src/
├── DB/               # Database connection and Mongoose models
├── common/           # Shared utilities, services, and middlewares (e.g., S3, Redis, error handling)
├── config/           # Configuration files and environment variables handling
├── modules/          # Feature-based modules (Auth, Posts, Comments, Notifications)
│   ├── auth/
│   ├── posts/
│   ├── Comments/
│   └── notifications/
├── types/            # TypeScript type definitions
├── app.controller.ts # Main application bootstrap and routing
└── index.ts          # Server entry point
```

## ⚙️ Prerequisites

Make sure you have the following installed on your machine:
- Node.js (v18+)
- MongoDB
- Redis server
- AWS S3 Bucket Credentials
- Firebase Service Account Key

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd social_app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create `.env.development` and `.env.production` files in the root directory based on your required configurations (e.g., Database URI, JWT Secret, AWS credentials, Redis port).

4. **Run the Development Server:**
   ```bash
   npm run start:dev
   ```

5. **Build & Run for Production:**
   ```bash
   npm run start:prod
   ```

## 📡 API Overview

The API provides both RESTful endpoints and a GraphQL endpoint.

### 🔐 Authentication & Users (`/auth`)

| Method | Endpoint | Description | Auth Required | Body Payload / Parameters |
|--------|----------|-------------|---------------|---------------------------|
| `POST` | `/auth/signup` | Register a new user account | No | `email`, `password`, `confirmPassword`, `username`, `age`, `gender` (optional), `address` (optional), `phone` (optional) |
| `POST` | `/auth/confirm-email` | Confirm user email address via OTP | No | `email`, `otp` |
| `POST` | `/auth/signin` | Login to get a JWT access token | No | `email`, `password` |
| `POST` | `/auth/resend-otp` | Resend confirmation OTP | No | `email` |
| `POST` | `/auth/signup/gmail` | Sign up/Sign in using Google account | No | - |
| `POST` | `/auth/update-password` | Update current user's password | Yes | `oldPassword`, `newPassword` |
| `POST` | `/auth/forgot-password` | Request password reset | No | `email` |
| `POST` | `/auth/reset-password` | Reset password using token | No | `email`, `otp`, `newPassword` |
| `POST` | `/auth/logout` | Logout user and invalidate token | Yes | - |
| `GET`  | `/auth/getMyProfile` | Get current logged-in user profile | Yes | - |
| `POST` | `/auth/upload-image` | Upload a single image | Yes | `attachment` (file) |
| `POST` | `/auth/upload-large-file` | Upload a large file (disk storage) | Yes | `attachment` (file) |
| `POST` | `/auth/upload-files` | Upload multiple files | No | `attachments` (files) |

### 📝 Posts (`/posts`)

| Method | Endpoint | Description | Auth Required | Body Payload / Parameters |
|--------|----------|-------------|---------------|---------------------------|
| `POST` | `/posts/` | Create a new post | Yes | `content` (optional if attachments present), `attachments` (files), `tags` (array of user IDs), `availability`, `allowComment` |
| `GET`  | `/posts/` | Get current user's posts | Yes | - |
| `GET`  | `/posts/feed` | Get posts feed | Yes | Pagination query parameters |
| `GET`  | `/posts/:id` | Get specific post by ID | Yes | `id` (path param) |
| `PUT`  | `/posts/:id` | Update a specific post | Yes | `content`, `attachments`, `tags`, `availability`, `allowComment`, `id` (path param) |
| `PATCH`| `/posts/:postId` | Like or unlike a post | Yes | `postId` (path param) |
| `DELETE`| `/posts/:id` | Delete a specific post | Yes | `id` (path param) |

### 💬 Comments (`/posts/:postId/comment`)

| Method | Endpoint | Description | Auth Required | Body Payload / Parameters |
|--------|----------|-------------|---------------|---------------------------|
| `POST` | `/posts/:postId/comment/` | Create a comment | Yes | `postId` (path param), `content` (optional if attachments present), `attachments` (files), `tags` |
| `GET`  | `/posts/:postId/comment/` | Get all comments for a post | Yes | `postId` (path param) |
| `PATCH`| `/posts/:postId/comment/:commentId` | Update a specific comment | Yes | `postId`, `commentId` (path params), `content`, `attachments`, `tags` |
| `POST` | `/posts/:postId/comment/:commentId/reply`| Reply to a specific comment | Yes | `postId`, `commentId` (path params), `content`, `attachments`, `tags` |
| `DELETE`| `/posts/:postId/comment/:commentId`| Delete a specific comment | Yes | `postId`, `commentId` (path params) |

### 🔔 Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/notifications/send-notification` | Send push notification using Firebase | No |

### 🌐 GraphQL Endpoint

- `POST /graphql` : Access the GraphQL API for querying users and other complex relationships.

## 📝 License

ISC License
