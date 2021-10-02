const requestHandler = require('./requestHandler')

const httpServer = require('http').createServer(requestHandler)


const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
})


const db = require('./db')

const { InMemorySessionStore } = require("./sessionStore")
const sessionStore = new InMemorySessionStore()

const { InMemoryMessageStore } = require("./messageStore")
const messageStore = new InMemoryMessageStore()

io.on("connection", async (socket) => {

  let image = await db.findUserPhoto(socket.handshake.auth.sessionID)
  image = "http://localhost:3000/uploads/" + image

  sessionStore.saveSession(socket.handshake.auth.sessionID, {
    sessionID: socket.handshake.auth.sessionID,
    username: socket.handshake.auth.username,
    connected: true,
    image: image
  })

  socket.join(socket.handshake.auth.sessionID)

  const users = []
  const messagesPerUser = new Map()
  messageStore.findMessagesForUser(socket.handshake.auth.sessionID).forEach((message) => {
    const { from, to } = message
    const otherUser = socket.handshake.auth.sessionID === from ? to : from
    if (messagesPerUser.has(otherUser)) {
      messagesPerUser.get(otherUser).push(message)
    } else {
      messagesPerUser.set(otherUser, [message])
    }
  })


  sessionStore.findAllSessions().forEach((session) => {
      if (session.sessionID !== undefined) {
        users.push({
          sessionID: session.sessionID,
          username: session.username,
          connected: session.connected,
          image: session.image,
          messages: messagesPerUser.get(session.sessionID) || [],
        })
      }
  })

  socket.emit("users", users)

  socket.broadcast.emit("user connected", {
    sessionID: socket.handshake.auth.sessionID,
    username: socket.handshake.auth.username,
    connected: true,
    image: image,
    messages: [],
  })


  socket.on("private message", ({ content, to }) => {
    const message = {
      content,
      from: socket.handshake.auth.sessionID,
      to,
    }
    socket.to(to).to(socket.handshake.auth.sessionID).emit("private message", message)
    messageStore.saveMessage(message)
  })

  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.handshake.auth.sessionID).allSockets()
    const isDisconnected = matchingSockets.size === 0
    if (isDisconnected) {
     
      socket.broadcast.emit("user disconnected", socket.handshake.auth.sessionID)
     
      sessionStore.saveSession(socket.handshake.auth.sessionID, {
        sessionID: socket.handshake.auth.sessionID,
        username: socket.handshake.auth.username,
        image: image,
        connected: false,
      })
    }
  })
})

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
)
