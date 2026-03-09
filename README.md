# E-Learning Platform (LMS)

A full-stack Learning Management System built with React and Node.js/Express, featuring real-time communication via Socket.IO and offline support using Service Workers and IndexedDB.

## Tech Stack

### Frontend
- **React 19** with Vite
- **React Router DOM v7** (nested routing)
- **Axios** (HTTP client)
- **react-pdf** (inline PDF viewer)
- **Socket.IO Client** (real-time submissions)
- **Service Worker** (offline asset caching)
- **IndexedDB** (offline data storage and submission queuing)

### Backend
- **Node.js** with **Express 5**
- **PostgreSQL** (via `pg`)
- **Socket.IO** (real-time events)
- **Multer** (file uploads, in-memory storage)
- **cookie-parser**, **cors**, **dotenv**

## Project Structure

```
E_learning_project/
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   ├── serviceworker.js         # Service Worker for offline caching
│   │   └── offline.html             # Offline fallback page
│   └── src/
│       ├── main.jsx                 # App entry point, IndexedDB setup, SW registration
│       ├── Home.jsx                 # Dashboard layout (navbar, sidebar, connectivity status)
│       ├── socket.js                # Socket.IO client connection
│       ├── routes/index.jsx         # All frontend routes
│       ├── main_content/
│       │   ├── Account/Account.jsx  # Static user profile page
│       │   ├── Courses/
│       │   │   ├── CourseList.jsx    # Lists enrolled courses (with offline cache)
│       │   │   ├── Courses.jsx      # Courses outlet wrapper
│       │   │   └── Module.jsx       # Single course detail (description, image, links)
│       │   └── Course_content/
│       │       ├── Lectures.jsx     # Lecture list for a course
│       │       ├── Lecturedisplay.jsx  # PDF viewer for lecture attachments
│       │       ├── Quizzes.jsx      # Quiz list for a course
│       │       ├── Question.jsx     # Quiz-taking form (timer, auto-submit, offline queue)
│       │       ├── Assignments.jsx  # Assignment list for a course
│       │       └── AssignmentSubmission.jsx  # Assignment PDF viewer + file upload
│       ├── styles/                  # CSS files
│       └── images/                  # Static images
├── server/                          # Express backend
│   ├── server.js                    # Express + Socket.IO setup, routes, socket handlers
│   ├── database/dbs.js              # PostgreSQL connection pool
│   ├── routes/
│   │   ├── coursesRoute.js          # GET /courses, GET /courseData/:id
│   │   ├── quizRoute.js             # GET /quizzes/:id, GET /quiz_questions/:id, POST /quiz_submission
│   │   ├── lectureRoute.js          # GET /lectures/:id, GET /attachment/:id
│   │   └── assignmentRoute.js       # GET /assignments/:id, GET /assignmentAttachment/:id, POST /submitAssignment/:id, GET /checkSubmission/:id/:sid
│   └── sqlQueries/
│       ├── courseQuery.js           # Course SQL queries
│       ├── quizQuery.js             # Quiz SQL queries + socket submission handler
│       ├── lectureQuery.js          # Lecture SQL queries
│       └── assignmentQuery.js       # Assignment SQL queries + Multer config + socket handler
└── lms_database.sql                 # PostgreSQL database dump
```

## Database Schema

The PostgreSQL database (`inventory`) contains the following tables:

| Table | Description |
|-------|-------------|
| `students` | Student records (student_id, name, email) |
| `courses` | Courses with images stored as bytea |
| `enrolments` | Student-course enrolment mapping |
| `quizzes` | Quiz metadata (title, description, due date) |
| `quiz_questions` | Multiple-choice questions (A/B/C/D) linked to quizzes |
| `quiz_submissions` | Student quiz answers stored as JSONB |
| `lectures` | Lecture info with PDF attachments stored as bytea |
| `assignments` | Assignments with PDF attachments stored as bytea |
| `assignment_submissions` | Student file uploads with binary data |

## Features

- **Course browsing** — students see only their enrolled courses
- **Lectures** — list view with inline PDF viewer for attachments
- **Quizzes** — timed multiple-choice quizzes with auto-submit on timer expiry or navigation away
- **Assignments** — view assignment PDFs and upload PDF submissions (max 5MB), with auto-incrementing filenames on resubmission
- **Connectivity status** — real-time banner showing Online / Server unreachable / Offline
- **Real-time submissions** — quiz and assignment submissions sent via Socket.IO with acknowledgment; falls back to HTTP POST

### Offline Support

**Service Worker:**
- Caches static assets (CSS, images, scripts) on install
- Serves cached pages when offline with an offline fallback page
- Cleans up old cache versions on activation

**IndexedDB:**
- Caches course lists, modules, lectures, quizzes, questions, and assignment attachments locally
- Queues quiz and assignment submissions when offline
- Automatically flushes pending submissions via Socket.IO when connectivity is restored

**Testing Offline Mode:**
To test offline functionality, open Chrome DevTools (`F12`), go to the **Application** tab, and tick the **Offline** checkbox under the Service Workers section. You can also inspect cached assets and IndexedDB stores from the same tab.

## Prerequisites

- **Node.js** v22+
- **PostgreSQL** 17+

## Installation

### 1. Database Setup

1. Install PostgreSQL and create a user/password
2. Restore the database from the included dump:
   ```bash
   pg_restore -U postgres -d postgres --create lms_database.sql
   ```
   Alternatively, you can use **pgAdmin 4** (included with the PostgreSQL installer) to restore the database via the GUI:
   - Open pgAdmin 4 and connect to your server
   - Right-click **Databases** → **Create** → **Database**, name it `inventory`
   - Right-click the `inventory` database → **Restore** → select `lms_database.sql` and click **Restore**

### 2. Server Setup

```bash
cd server
npm install
```

Configure `server/.env`:
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=inventory
PORT=3000
```

### 3. Client Setup

```bash
cd client
npm install
```

Configure `client/.env`:
```
VITE_STATIC_STUDENT_ID=48a56da7
```

The student ID must match a `student_id` in the `students` / `enrolments` tables to see enrolled courses.

## Running the Application

Start the server:
```bash
cd server
npm run dev
```

Start the client (in a separate terminal):
```bash
cd client
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3000

### Production Build

```bash
cd client
npm run build
npm run preview
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/courses?studentId=` | List enrolled courses |
| GET | `/courseData/:course_id` | Course details with image |
| GET | `/quizzes/:course_id` | List quizzes for a course |
| GET | `/quiz_questions/:quiz_id` | Get questions for a quiz |
| POST | `/quiz_submission` | Submit quiz answers |
| GET | `/lectures/:course_id` | List lectures for a course |
| GET | `/attachment/:lecture_id` | Get lecture PDF attachment |
| GET | `/assignments/:course_id` | List assignments for a course |
| GET | `/assignmentAttachment/:assignment_id` | Get assignment PDF attachment |
| POST | `/submitAssignment/:assignment_id` | Upload assignment submission (multipart) |
| GET | `/checkSubmission/:assignment_id/:student_id` | Check if student has submitted |

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `quiz-submit` | Client → Server | Submit quiz answers with acknowledgment |
| `assignment-submit` | Client → Server | Submit assignment with Base64-encoded file |

Both events support offline queuing and automatic retry on reconnection.

## Author

Mohammed Altigani
