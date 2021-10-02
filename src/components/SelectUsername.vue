<template>
  <div id="m-main">
    <button v-on:click="trigger" class="triggerFormButton">{{ triggerForm }}</button>
        <div class="form" v-if="isSign">
            <form class="m-form" v-on:submit.prevent>
                <div class="container">
                  <span style="color: red;">{{ error }}</span>
                  <h1 style="margin-bottom: 10px;">Sign Up</h1>
                  <hr style="margin-bottom: 10px;"/>

                  <label for="username"><b>Username</b></label>
                  <input v-model="username" type="text" placeholder="Enter Username" name="username"  autocomplete="name">

                  <label for="email"><b>Email</b></label>
                  <input v-model="email" type="text" placeholder="Enter Email" name="email"  autocomplete="email">
            
                  <label for="psw"><b>Password</b></label>
                  <input v-model="password" type="password" placeholder="Enter Password" name="password"  autocomplete="new-password">
            
                  <label for="psw-repeat"><b>Repeat Password</b></label>
                  <input v-model="repeatPassword" type="password" placeholder="Repeat Password" name="psw-repeat"  autocomplete="new-password">
                  
                  <div>
                    <button :disabled="isValid" v-on:click="onSubmit" type="submit" class="submitbtn">Sign Up</button>
                  </div>

                </div>
              </form>
        </div>

               <div class="form" v-else>
            <form class="m-form" v-on:submit.prevent>
                <div class="container">
                  <span style="color: red;">{{ error }}</span>
                  <h1 style="margin-bottom: 10px;">Login</h1>
                  <hr style="margin-bottom: 10px;"/>

                  <label for="username"><b>Username</b></label>
                  <input v-model="username" type="text" placeholder="Enter Username" name="username"  autocomplete="name">

                  <label for="psw"><b>Password</b></label>
                  <input v-model="password" type="password" placeholder="Enter Password" name="password"  autocomplete="new-password">

                  <div>
                    <button :disabled="isValidLogin" v-on:click="onLogin" type="submit" class="submitbtn">Login</button>
                  </div>

                </div>
              </form>
        </div>
    </div>
</template>

<script>
import socket from "../socket";

export default {
  name: "SelectUsername",
  data() {
    return {
      isSign: true,
      triggerForm: 'Login',
      username: "",
      password: "",
      repeatPassword: "",
      email: "",
      error: ""
    };
  },
  computed: {
    isValid() {
      return !(this.username.length > 2 && this.password !== "" && this.password === this.repeatPassword)
    },
    isValidLogin() {
            return !(this.username.length > 2 && this.password !== "")
    }

  },
  methods: {
   async onLogin() {
  const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: this.username,
            password: this.password
        })
    })

    const data = await res.json()


    if (res.ok){
      localStorage.setItem('sessionID', data.sessionID)
      localStorage.setItem('username', this.username)
      socket.auth = { sessionID: data.sessionID, username: this.username }
      socket.connect();
      this.$emit("input", this.username)
    }else {
        this.error = "user does not exist or an internal error, try again"
      }


    },
    trigger() {
      this.triggerForm = this.triggerForm == "Login" ?  "Sign up" : "Login"
      this.isSign = !this.isSign
    },

    async onSubmit() {
      const res = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: this.username,
            email: this.email,
            password: this.password
        })
    })

    const data = await res.json()


    if (res.ok){
           localStorage.setItem('sessionID', data.sessionID)
      localStorage.setItem('username', this.username)
      socket.auth = { sessionID: data.sessionID, username: this.username }
      socket.connect();
      this.$emit("input", this.username)
    }else {
      if (data.message === "user has already existed") {
        this.error = "user has already existed"
      }
    }

    },
  },
};
</script>

<style scoped>
* {
    margin: 0%;
    padding: 0%;
    box-sizing: border-box;
    
}

body {
  margin: 0px;
  padding: 0px;
}

#app {
  margin: 0px;
  padding: 0px;
}

h1, p, label {
  color: black;
}
#m-main {
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    flex-flow: column;
    align-items: center;
    font-family: Arial, Helvetica, sans-serif;
     background-color: white;
     margin: 0px;
}

.container {
  background-color: white;
}
.form {
    width: 50%;
}

input[type=text], input[type=password] {
    width: 100%;
    padding: 15px;
    margin: 5px 0 22px 0;
    display: inline-block;
    border: none;
    background: #f1f1f1;
}
input[type=text]:focus, input[type=password]:focus {
    background-color: #ddd;
    outline: none;
}
button {
    background-color: #04AA6D;
    color: white;
    padding: 14px 20px;
    margin: 8px 0;
    border: none;
    cursor: pointer;
    width: 20%;
    opacity: 0.9;
}

.triggerFormButton {
  background-color:#044caa;
    color: white;
    padding: 14px 20px;
    margin: 8px 0;
    border: none;
    cursor: pointer;
    width: 20%;
    opacity: 0.9;
}
  
button:hover {
    opacity:1;
}

button:disabled {
  background-color: #ddd;
}
</style>
