# Hospital Management System (HMS)

This is a **Hospital Management System** project built using Angular for the frontend and Node.js/Express/MongoDB for the backend. Follow the instructions below to set up and run the project.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Step-by-Step Installation](#step-by-step-installation)
   - [1. Backend Setup](#1-backend-setup)
   - [2. Frontend Setup](#2-frontend-setup)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Tech Stack
* **Frontend:** Angular 17, Angular Material, RxJS, Tailwind CSS (or Custom CSS)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (using Mongoose ODM)
* **Authentication:** JWT (JSON Web Tokens) & bcryptjs

---

## Prerequisites
You must have the following installed on your system:
* [Node.js](https://nodejs.org/) (Recommended: LTS version)
* [MongoDB Community Server](https://www.mongodb.com/try/download/community) (Local instance) or MongoDB Atlas connection string.
* Angular CLI (`npm install -g @angular/cli`)

---

## Project Structure
```text
Doctor_mern/
├── backend/          # Express.js backend API
└── frontend/         # Angular frontend app
```

---

## Step-by-Step Installation

### 1. Backend Setup
1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Check the `.env` file in the `backend/` directory and update values if needed:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hms
   JWT_SECRET=hms_secret_token_key_for_development_2026
   JWT_EXPIRE=30d
   ```

4. **Seed Database (Optional but Recommended):**
   To load initial sample data into MongoDB:
   ```bash
   npm run seed
   ```

---

### 2. Frontend Setup
1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   > [!IMPORTANT]
   > **`tslib` Error Resolution:** If you get the error `This syntax requires an imported helper but module 'tslib' cannot be found` when opening the Angular project for the first time, it is because Angular needs the `tslib` helper library to compile. Running `npm install` automatically downloads it to the `node_modules` directory, which resolves this error.

---

## Running the Application

Open two separate terminals to run the backend and frontend services:

### Run Backend
```bash
cd backend
npm start
```
* The Backend API will run on `http://localhost:5000`.

### Run Frontend
```bash
cd frontend
npm start
```
* The Angular Development Server will run on `http://localhost:4200`.

---

## Troubleshooting

### Error: `Module 'tslib' cannot be found`
* **Cause:** The `node_modules` folder is missing or not fully installed.
* **Solution:** Run `npm install` inside the `frontend` folder.

### Error: `Cannot connect to MongoDB`
* **Cause:** The MongoDB service is not running on your local machine.
* **Solution:** Ensure your local MongoDB instance is started (e.g., via Windows Services or CLI).
