###  Real-time Collaborative Document Editor

- **Company:** CODTECH IT SOLUTION  
- **Intern Name:** Channabasava Rampur  
- **Intern ID:** CT06DY2265  
- **Domain:** Full Stack Web Development  
- **Duration:** 6 Weeks  
- **Mentor:** Neela Santhos
- 
## Table of Contents

1. Project Overview
2. Features
3. Tech Stack
4. Repository Structure
5. Environment Variables
6. Backend (Server) — Setup & Run
7. Frontend (Client) — Setup & Run
8. Socket.IO events (contract)
9. Database Schema (Mongoose)
10. Important Implementation Notes
11. Troubleshooting & Common Issues
12. Deployment Tips
13. Contributing
14. License

---

## 1. Project Overview

This project implements a real-time collaborative rich-text editor using React, React-Quill (Quill), Node.js, Express, Socket.IO, and MongoDB. Multiple users can open the same document ID and edit in real-time. The server persists document contents to MongoDB and tracks connected users per document, broadcasting presence updates.

## 2. Features

* Create new document (random ID) or open an existing one by ID
* Real-time text collaboration (operational deltas via Quill)
* Auto-save at a configurable interval
* Presence / connected-users list per document
* Persistent storage using MongoDB (documents saved by id)

## 3. Tech Stack

* Backend: Node.js, Express, Socket.IO, Mongoose
* Frontend: React, React-Quill, Bootstrap (react-bootstrap)
* Database: MongoDB (local or Atlas)
* Dev tools: nodemon, dotenv

## 4. Repository Structure (recommended)

```
project-root/
├─ server.js                  # Backend entry point
├─ package.json               # Backend dependencies & scripts (or separate package.json per folder)
├─ models/
│  └─ Document.js             # Mongoose model
├─ client/                    # React app
│  ├─ package.json
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ Editor.jsx
│  │  └─ index.js
│  └─ public/
└─ README.md
```

> Note: You may split backend and frontend into two folders (`server` and `client`). Adjust scripts accordingly.

## 5. Environment Variables

Create a `.env` file at the server root (not committed to git). Example:

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/collab-editor
# or for MongoDB Atlas
# MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/collab-editor?retryWrites=true&w=majority
```

## 6. Backend (Server) — Setup & Run

**Install dependencies**

```bash
# from project root (if server is root)
npm install express socket.io mongoose cors dotenv
npm install --save-dev nodemon
```

**Start server in development**

Add to `package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Run:

```bash
npm run dev
```

**Key server responsibilities**

* Accept Socket.IO connections
* Manage `usersPerDoc` mappings (Map of userId=>username per document)
* `get-document` event: find or create document and return saved contents
* Broadcast `users-update` events when users join/leave
* Relay Quill `send-changes` deltas to other clients
* Persist document on `save-document`

## 7. Frontend (Client) — Setup & Run

**Install dependencies** (inside `client/` if separate):

```bash
npx create-react-app client
cd client
npm install react-quill socket.io-client uuid react-bootstrap bootstrap animate.css @fortawesome/fontawesome-free
```

**Run**

```bash
npm start
```

**Important notes for client**

* On load: generate a unique `userId` for each browser session (or persist using `localStorage` if you want the same identity on refresh). Use `uuidv4()` from `uuid`.
* Provide `username` input at entry and pass `{ userId, username }` via Socket.IO `auth` when connecting.
* Subscribe to `load-document`, `receive-changes`, and `users-update` events.
* Emit `send-changes` on Quill `text-change` when `source === 'user'`.
* Auto-save using `save-document` event with the Quill doc contents at an interval (e.g. 2000 ms).

## 8. Socket.IO events (contract)

**Client -> Server**

* `get-document` (docId) — join the doc room and request data
* `send-changes` (delta) — broadcast delta to other clients
* `save-document` (data) — ask server to persist document

**Server -> Client**

* `load-document` (data) — initial contents of the document
* `receive-changes` (delta) — apply changes from other users
* `users-update` (Array<[userId, username]>) — presence list for the document

## 9. Database Schema (Mongoose)

Example `models/Document.js`:

```js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  _id: String, // using docId as the _id
  data: Object // Quill Delta / contents
});

module.exports = mongoose.model('Document', DocumentSchema);
```

Store `data` as the Quill Delta object (it is JSON serializable).

## 10. Important Implementation Notes

* **Unique user IDs**: Ensure every client connection sends a unique `userId`. If multiple clients send the same `userId`, presence tracking will break. Two valid options:

  * **Per-session ID**: generate with `uuidv4()` on each page load (ensures uniqueness across shared links).
  * **Persistent ID**: store ID in `localStorage` to keep the same identity across refreshes on the same browser. Be careful when sharing links — other people will get their own IDs when they open the link.

* **Presence updates**: Maintain a `Map` or object for each document storing `userId -> username`. Add on `get-document`, remove on `disconnect` (using the `socket.handshake.auth` or the server-stored mapping for socket id).

* **Socket handshake auth**: When creating the socket from the client, pass auth: `{ userId, username }`. On the server, read `socket.handshake.auth`.

* **Race conditions & delta merging**: Quill deltas are not a true CRDT. For a robust multi-user experience consider CRDT/OT libraries (Yjs, Automerge, ShareDB) if you need advanced concurrency guarantees.

## 11. Troubleshooting & Common Issues

### Problem: New connected users not showing

**Cause**: Multiple clients use the same `userId` (often from copied `localStorage` or shared state).
**Fix**: Generate a new `userId` per browser session or ensure unique ids for each browser.

### Problem: `disconnect` does not remove user

**Cause**: `disconnect` handler is registered inside a callback incorrectly or `currentDocId` is undefined.
**Fix**: Ensure you track `currentDocId` on the socket scope and that disconnect handler removes the user from `usersPerDoc[currentDocId]`.

### Problem: Repeated saves flood console

**Cause**: very short save interval.
**Fix**: Increase `SAVE_INTERVAL` (e.g. 2000–5000 ms) or save only on idle.

### Problem: Same socket saved multiple times with same userId

**Fix**: Validate uniqueness on the server when adding user to `usersPerDoc` (e.g., don’t set same userId twice; if userId exists, optionally update username or generate a session suffix).

## 12. Deployment Tips

* Use environment variables for production DB (MongoDB Atlas connection string).
* For production, host backend on a platform (Heroku, Render, Fly.io, Digital Ocean) and configure CORS and allowed origins accordingly.
* For Socket.IO behind proxies/load balancers, use sticky sessions or a message-broker adapter (Redis adapter) for multi-instance scaling.
* Serve the built React app (client) via Nginx or serve it through the Node/Express static middleware in production.

## 13. Contributing

1. Fork repository
2. Create a feature branch
3. Make changes, add tests (if any)
4. Open PR with description


## output:
---
<img width="1909" height="992" alt="Image" src="https://github.com/user-attachments/assets/b0c2d1a5-1bf7-48d9-bea6-77f51eb6bf7f" />
<img width="1787" height="976" alt="Image" src="https://github.com/user-attachments/assets/dc5f35dc-b27e-47d2-8e40-171675bfcc20" />
<img width="1886" height="1044" alt="Image" src="https://github.com/user-attachments/assets/f7978d75-630b-4008-97e9-78cfbdcda777" />
<img width="1858" height="1039" alt="Image" src="https://github.com/user-attachments/assets/29fd5a6d-0360-4400-a086-36d749815ee2" />
