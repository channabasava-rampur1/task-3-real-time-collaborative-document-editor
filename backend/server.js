require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const Document = require('./models/Document');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-editor';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.get('/', (req, res) => res.send('Server is running...'));

// Function to find or create a document
async function findOrCreateDocument(id) {
  if (!id) return;
  const existing = await Document.findById(id);
  if (existing) return existing;
  return await Document.create({ _id: id });
}

// Track users per document
const usersPerDoc = {}; // { docId: Map(userId => username) }

// Socket.IO connection
io.on('connection', (socket) => {
  const { userId, username } = socket.handshake.auth; // auth data sent from frontend
  let currentDocId;

  console.log(`🔹 User connected: ${username} (ID: ${userId})`);

  socket.on('get-document', async (docId) => {
    currentDocId = docId;

    // Initialize map for this doc if not exists
    if (!usersPerDoc[docId]) usersPerDoc[docId] = new Map();

    // Add this user
    usersPerDoc[docId].set(userId, username);

    socket.join(docId);

    // Notify all users in this doc about connected users
    io.in(docId).emit('users-update', Array.from(usersPerDoc[docId].entries()));
    console.log(`📄 ${username} joined document: ${docId}`);
    console.log(`👥 Current users in ${docId}:`, Array.from(usersPerDoc[docId].values()));

    // Load document content
    const document = await findOrCreateDocument(docId);
    socket.emit('load-document', document.data);

    // Listen for text changes
    socket.on('send-changes', (delta) => {
      socket.broadcast.to(docId).emit('receive-changes', delta);
    });

    // Listen for document save
    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(docId, { data });
      console.log(`💾 Document ${docId} saved by ${username}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (currentDocId && usersPerDoc[currentDocId]) {
        usersPerDoc[currentDocId].delete(userId); // remove only this user
        io.in(currentDocId).emit(
          'users-update',
          Array.from(usersPerDoc[currentDocId].entries())
        );
        console.log(`❌ ${username} disconnected from document: ${currentDocId}`);
        console.log(`👥 Remaining users in ${currentDocId}:`, Array.from(usersPerDoc[currentDocId].values()));

        // Clean up if no users left
        if (usersPerDoc[currentDocId].size === 0) {
          delete usersPerDoc[currentDocId];
          console.log(`🗑️ No users left in document ${currentDocId}, cleaned up.`);
        }
      }
    });
  });
});

// Start server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
