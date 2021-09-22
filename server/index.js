const requestHandler = require('./requestHandler')

const httpServer = require('http').createServer(requestHandler)


const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
})


const db = require('./db')

const crypto = require("crypto")
const randomId = () => crypto.randomBytes(8).toString("hex")

const { InMemorySessionStore } = require("./sessionStore")
const sessionStore = new InMemorySessionStore()

const { InMemoryMessageStore } = require("./messageStore")
const messageStore = new InMemoryMessageStore()

// io.use((socket, next) => {
//   const sessionID = socket.handshake.auth.sessionID
//   console.log(sessionID)
//   if (sessionID) {
//     const session = sessionStore.findSession(sessionID)
//     if (session) {
//       socket.sessionID = sessionID
//       socket.userID = session.userID
//       socket.username = session.username
//       return next()
//     }
//   }
//   const username = socket.handshake.auth.username
//   if (!username) {
//     return next(new Error("invalid username"))
//   }
//   socket.sessionID = randomId()
//   socket.userID = randomId()
//   socket.username = username
//   next()
// })

io.on("connection", async (socket) => {


  console.log(socket.handshake.auth.sessionID)

  let image = await db.findUserPhoto(socket.handshake.auth.sessionID)
  image = "http://localhost:3000/uploads/" + image

  // persist session
  sessionStore.saveSession(socket.handshake.auth.sessionID, {
    sessionID: socket.handshake.auth.sessionID,
    username: socket.handshake.auth.username,
    connected: true,
    image: image
  })

  // // emit session details
  // socket.emit("session", {
  //   sessionID: socket.sessionID,
  //   userID: socket.userID,
  // })

  // join the "userID" room
  socket.join(socket.handshake.auth.sessionID)

  // fetch existing users
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

    console.log(session.sessionID)
    users.push({
      sessionID: session.sessionID,
      username: session.username,
      connected: session.connected,
      image: session.image,
      messages: messagesPerUser.get(session.sessionID) || [],
    })
  })
  socket.emit("users", users)

  // notify existing users
  socket.broadcast.emit("user connected", {
    sessionID: socket.handshake.auth.sessionID,
    username: socket.username,
    connected: true,
    messages: [],
  })

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on("private message", ({ content, to }) => {
    const message = {
      content,
      from: socket.handshake.auth.sessionID,
      to,
    }
    socket.to(to).to(socket.handshake.auth.sessionID).emit("private message", message)
    messageStore.saveMessage(message)
  })

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.handshake.auth.sessionID).allSockets()
    const isDisconnected = matchingSockets.size === 0
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("user disconnected", socket.handshake.auth.sessionID)
      // update the connection status of the session
      sessionStore.saveSession(socket.handshake.auth.sessionID, {
        sessionID: socket.handshake.auth.sessionID,
        username: socket.username,
        connected: false,
      })
    }
  })
})

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
)
