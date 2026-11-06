const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

app.get('/', (req, res) => {
  res.send('AnonChat server is running 🟢');
});

// Keep track of online user count
let onlineCount = 0;

// Generate fun anonymous names
const adjectives = ['Silent', 'Neon', 'Cosmic', 'Lazy', 'Blazing', 'Quiet', 'Fuzzy', 'Wild', 'Swift', 'Sleepy'];
const nouns = ['Panda', 'Fox', 'Comet', 'Hawk', 'Tiger', 'Otter', 'Wolf', 'Shark', 'Eagle', 'Dragon'];

function randomName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${noun}${num}`;
}

io.on('connection', (socket) => {
  onlineCount++;
  const name = randomName();
  socket.data.name = name;

  // Tell the user their assigned name
  socket.emit('assigned_name', name);

  // Broadcast updated count
  io.emit('online_count', onlineCount);

  // Announce join
  socket.broadcast.emit('system_message', `${name} joined the chat`);

  socket.on('send_message', (text) => {
    if (typeof text !== 'string') return;
    const trimmed = text.trim().slice(0, 500);
    if (!trimmed) return;
    io.emit('new_message', {
      name: socket.data.name,
      text: trimmed,
      ts: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online_count', onlineCount);
    io.emit('system_message', `${socket.data.name} left the chat`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
