import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import { UserEvent, ChatEvent } from './types/constants';

const { PORT = 3152 } = process.env

const app = express();

app.get('/', (_, res) => {
  res.json({ ok: true })
});

// https://socket.io/docs/emit-cheatsheet/
const server = http.createServer(app);
const io = socketio(server);
const users = new Map();

io.use((socket, next) => {
  const { user } = socket.handshake.query;

  if (!user) {
    throw new Error("Nop");
  }
  
  next();
});

io.on(UserEvent.CONNECT, (socket) => {
  const { user: rawUser } = socket.handshake.query;
  const user = JSON.parse(rawUser);
  console.log(socket.id);
  user.socketId = socket.id;

  console.log('[socket] connected', user.id);
  
  socket.broadcast.emit(UserEvent.JOIN, user);
  io.to(socket.id).emit(UserEvent.LIST, Array.from(users));
  
  users.set(user.id, user);

  socket.on(ChatEvent.JOIN, (data) => {
    socket.join(data.room);
  });

  socket.on(ChatEvent.LEAVE, (data) => {
    socket.leave(data.room);
  });

  socket.on(UserEvent.DISCONNECT, () => {
    users.delete(user.id);
    console.log('[socket] disconnect', user.id);
  });
});


server.listen(PORT, () => console.log(`Server running at: http://localhost:${PORT}`));