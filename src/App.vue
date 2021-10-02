<template>
  <div id="app">
        <select-username
      v-if="!usernameAlreadySelected"
      @input="onUsernameSelection"
    />
    <chat v-else />

  </div>

</template>

<script>
import SelectUsername from "./components/SelectUsername";
import Chat from "./components/Chat";
import socket from "./socket";

export default {
  name: "App",
  components: {
    Chat,
    SelectUsername,
  },
  data() {
    return {
      usernameAlreadySelected: false,
    };
  },
  methods: {
    onUsernameSelection(username) {
      this.usernameAlreadySelected = true
      localStorage.setItem("username", username)
      socket.connect();
    },
  },
  created() {
    const sessionID = localStorage.getItem("sessionID")
    const username = localStorage.getItem("username")

    if (sessionID) {
      socket.auth = { sessionID, username }
      socket.connect();
      this.usernameAlreadySelected = true;
    }

    socket.on("connect_error", (err) => {
      if (err.message === "invalid username") {
        this.usernameAlreadySelected = false;
      }
    });
  },
  destroyed() {
    socket.off("connect_error");
  },
};
</script>

<style>
@import url(https://fonts.googleapis.com/css?family=Lato:400,700);
*, *:before, *:after {
  box-sizing: border-box;
  font-family: 'Lato';
}
</style>
