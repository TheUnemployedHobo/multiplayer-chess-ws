# Multiplayer Chess WS

A TypeScript backend for a multiplayer chess application built with Express, Prisma, MongoDB, and Socket.IO.

## Overview

This project provides the server-side foundation for managing:

- user registration and authentication
- user profile retrieval and updates
- match history retrieval
- friend list lookup
- JWT-based protected routes

## Features

- Express-based REST API
- Prisma ORM with MongoDB
- JWT authentication
- Password hashing with bcrypt
- Request validation via express-validator
- Error handling middleware
- Stockfish integration support

## Tech Stack

- Node.js + TypeScript
- Express
- Prisma
- MongoDB
- Socket.IO
- JSON Web Tokens
- bcrypt

## Project Structure

- src/index.ts - application entrypoint
- src/routes - route definitions for users, matches, and friends
- src/controllers - request handlers
- src/middlewares - auth and validation middleware
- prisma/schema.prisma - database schema

## Prerequisites

- Node.js 20+
- npm
- MongoDB instance

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a .env file with the required environment variables:

```env
PORT=3000
SERVER_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/multiplayer-chess
```

4. Generate the Prisma client:

```bash
npx prisma generate
```

## Running the Server

Start the development server:

```bash
npm start
```

The server will run using tsx watch and listen on the configured port.

## Build and Lint

Build the project:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## API Endpoints

### Users

- POST /users/register - create a new user
- POST /users/login - authenticate a user and return a JWT
- GET /users - get the authenticated user's profile
- PUT /users - update the authenticated user's profile
- DELETE /users - delete the authenticated user's account

### Matches

- GET /matches - get match history for the authenticated user

### Friends

- GET /friends - get the authenticated user's friends

## Authentication

Protected routes expect a JWT in the Authorization header:

```http
Authorization: <jwt>
```

## Notes

This repository currently focuses on the backend API layer. The Prisma schema is configured for MongoDB, so a running MongoDB instance is required for persistence.
