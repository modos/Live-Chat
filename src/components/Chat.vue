<template>
  <div class="body">
    <div class="container clearfix">
    <div class="people-list" id="people-list">
      <div class="search">
        <input v-model="searchTerm" type="text" placeholder="Search..." />
        <i class="fa fa-search"></i>
      </div>

        <form id="imageForm" @submit.prevent="handleSubmit" method="post" enctype="multipart/form-data">
      <input type="file" name="filetoupload" @change="uploadFile">
      <input type="submit" value="Upload Avatar">
  </form>
  
   <ul class="list">
                <user
        v-for="user in search"
        :key="user.sessionID"
        :user="user"
        :selected="selectedUser === user"
        @select="onSelectUser(user)"
      />
   </ul>
    </div>
    
    <div class="chat">
      <div class="chat-header clearfix">
        <img v-bind:src="selectedUser.image" alt="avatar" width="50px" height="50px"/>
        
        <div class="chat-about">
          <div class="chat-with">{{selectedUser.username}}</div>
          <div class="chat-num-messages">already {{selectedUser.messages.length}} messages</div>
        </div>
        <i class="fa fa-star"></i>
      </div> <!-- end chat-header -->
          <message-panel
      v-if="selectedUser"
      :user="selectedUser"
      @input="onMessage"
      class="right-panel"
    />
 <!-- end chat-message -->
      
    </div> <!-- end chat -->
    
  </div> <!-- end container -->

  </div>
</template>

<script>
import socket from "../socket";
import User from "./User";
import MessagePanel from "./MessagePanel";

export default {
  name: "Chat",
  components: { User, MessagePanel },
  data() {
    return {
      selectedUser: { image: "http://localhost:8080/avatar.png", username: "Select a User",
      messages: {
        length: 0
      }},
      users: [],
      file: null,
      searchTerm: ''
    };
  },
  methods: {
    uploadFile (event) {
        this.file = event.target.files[0]
      },
    async handleSubmit() {
      const formData = new FormData()
      formData.append('image', this.file)
      formData.append('username', localStorage.getItem('username'))
      const req = await fetch('http://localhost:3000/uploadPhoto' , {
        method: 'POST',
        body: formData
      })

  const data = await req.json()

this.users.forEach((user) => {
        if (user.self) {
          user.connected = false
          user.image = data.image
        }
      })

    },
    onMessage(content) {
      if (this.selectedUser) {
        socket.emit("private message", {
          content,
          to: this.selectedUser.sessionID,
        });
        this.selectedUser.messages.push({
          content,
          fromSelf: true,
        });
      }
    },
    onSelectUser(user) {
      this.selectedUser = user;
      user.hasNewMessages = false;
    },
  },
  created() {
    socket.on("connect", () => {
      this.users.forEach((user) => {
        if (user.self) {
          user.connected = true;
        }
      });
    });

    socket.on("disconnect", () => {
      this.users.forEach((user) => {
        if (user.self) {
          user.connected = false;
        }
      });
    });

    const initReactiveProperties = (user) => {
      user.hasNewMessages = false;
    };

    socket.on("users", (users) => {
      users.forEach((user) => {
        user.messages.forEach((message) => {
          message.fromSelf = message.from === socket.auth.sessionID;
        });
        for (let i = 0; i < this.users.length; i++) {
          const existingUser = this.users[i];
          if (existingUser.sessionID === user.sessionID) {
            existingUser.connected = user.connected;
            existingUser.messages = user.messages;
            return;
          }
        }
        user.self = user.sessionID === socket.auth.sessionID;
        initReactiveProperties(user);
        this.users.push(user);
      });
      // put the current user first, and sort by username
      this.users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
      });
    });

    socket.on("user connected", (user) => {
      for (let i = 0; i < this.users.length; i++) {
        const existingUser = this.users[i];
        if (existingUser.sessionID === user.sessionID) {
          existingUser.connected = true;
          return;
        }
      }
      initReactiveProperties(user);
      this.users.push(user);
    });

    socket.on("user disconnected", (id) => {
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        if (user.sessionID === id) {
          user.connected = false;
          break;
        }
      }
    });

    socket.on("private message", ({ content, from, to }) => {
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        const fromSelf = socket.auth.sessionID === from;
        if (user.sessionID === (fromSelf ? to : from)) {
          user.messages.push({
            content,
            fromSelf,
          });
          if (user !== this.selectedUser) {
            user.hasNewMessages = true;
          }
          break;
        }
      }
    });
  },
  computed: {
    search() {
      return this.users.filter(user => {
        if (user.username !== undefined) {
        return user.username.toLowerCase().includes(this.searchTerm);

        }
        
      });
    }
  },
  destroyed() {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("users");
    socket.off("user connected");
    socket.off("user disconnected");
    socket.off("private message");
  },
};
</script>

<style>
@import url(https://fonts.googleapis.com/css?family=Lato:400,700);
*, *:before, *:after {
  box-sizing: border-box;
  padding: 0px;
  margin: 0px;
}

.body {
  background: #220901;
  font: 14px/20px "Lato", Arial, sans-serif;
  padding: 40px 0;
  color: white;
}
.container {
  margin: 0 auto;
  width: 750px;
  background: #941b0c;
  border-radius: 5px;
}

.people-list {
  width: 260px;
  float: left;
}
.people-list .search {
  padding: 20px;
}
.people-list input {
  border-radius: 3px;
  border: none;
  padding: 14px;
  width: 90%;
  font-size: 14px;
}

#imageForm {
      display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
}
.people-list .fa-search {
  position: relative;
  left: -25px;
}
.people-list ul {
  padding: 20px;
}
.people-list ul li {
  padding-bottom: 20px;
}
.people-list img {
  float: left;
}
.people-list .about {
  float: left;
  margin-top: 8px;
}
.people-list .about {
  padding-left: 8px;
}
.people-list .status {
  color: #92959E;
}

.chat {
  width: 490px;
  float: left;
  background: #F2F5F8;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  color: #434651;
}
.chat .chat-header {
  padding: 20px;
  border-bottom: 2px solid white;
}
.chat .chat-header img {
  float: left;
}
.chat .chat-header .chat-about {
  float: left;
  padding-left: 10px;
  margin-top: 6px;
}
.chat .chat-header .chat-with {
  font-weight: bold;
  font-size: 16px;
}
.chat .chat-header .chat-num-messages {
  color: #92959E;
}
.chat .chat-header .fa-star {
  float: right;
  color: #D8DADF;
  font-size: 20px;
  margin-top: 12px;
}
.chat .chat-history {
  border-bottom: 2px solid white;
  overflow-y: scroll;
  height: 575px;
}
.chat .chat-history .message-data {
  margin-bottom: 15px;
}
.chat .chat-history .message-data-time {
  color: #a8aab1;
  padding-left: 6px;
}
.chat .chat-history .message {
  color: white;
  line-height: 26px;
  font-size: 16px;
  border-radius: 7px;
  margin-bottom: 30px;
  position: relative;
}
.chat .chat-history .message:after {
  bottom: 100%;
  left: 7%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
  border-bottom-color: #86BB71;
  border-width: 10px;
  margin-left: -10px;
}

.chat .chat-history .other-message {
  background: #94C2ED;
}
.chat .chat-history .other-message:after {
  border-bottom-color: #94C2ED;
  left: 93%;
}
.chat .chat-message {
  padding: 30px;
}
.chat .chat-message textarea {
  width: 100%;
  border: none;
  padding: 10px 20px;
  font: 14px/22px "Lato", Arial, sans-serif;
  margin-bottom: 10px;
  border-radius: 5px;
  resize: none;
}
.chat .chat-message .fa-file-o, .chat .chat-message .fa-file-image-o {
  font-size: 16px;
  color: gray;
  cursor: pointer;
}
.chat .chat-message button {
  float: right;
  color: #f6aa1c;
  font-size: 16px;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  font-weight: bold;
  background: #F2F5F8;
}
.chat .chat-message button:hover {
  color: #75b1e8;
}

.online, .offline, .me {
  margin-right: 3px;
  font-size: 10px;
}

.online {
  color: #86BB71;
}

.offline {
  color: #E38968;
}

.me {
  color: #94C2ED;
}

.align-left {
  text-align: left;
}

.align-right {
  text-align: right;
}

.float-right {
  float: right;
}

.clearfix:after {
  visibility: hidden;
  display: block;
  font-size: 0;
  content: " ";
  clear: both;
  height: 0;
}

.list {
  /* overflow-y: scroll; */
}

.list li {
   list-style-type: none;
}

.li_button {
  display: block;
}

.li_button:hover {
  background-color: #a8aab191;
}
</style>