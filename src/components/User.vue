<template>
   
        <li class="clearfix li_button">
  <div class="user" @click="onClick" :class="{ selected: selected }">
    <div class="description">

              <img class="avatar" v-bind:src="user.image" alt="" width="35px" height="35px"> 
      <div class="name">
        {{ user.username }} {{ user.self ? " (yourself)" : "" }}
      </div>
      <div class="status">
        <status-icon :connected="user.connected" />{{ status }}
      </div>
    </div>
    <div v-if="user.hasNewMessages" class="new-messages">!</div>
  </div>
        </li>
   
</template>

<script>
import StatusIcon from "./StatusIcon";
export default {
  name: "User",
  components: { StatusIcon },
  props: {
    user: Object,
    selected: Boolean,
  },
  methods: {
    onClick() {
      this.$emit("select");
    },
  },
  computed: {
    status() {
      return this.user.connected ? "online" : "offline";
    },
  },
};
</script>

<style scoped>

.avatar {
   margin-right: 10px;
}

.selected {
  background-color: #bc3908;
}

.user {
  padding: 10px;
}

.description {
  display: inline-flex;
}

.status {
  color: #92959e;
  margin-left: 5px;
}

.new-messages {
  color: white;
  background-color: red;
  width: 20px;
  border-radius: 5px;
  text-align: center;
  float: right;
  margin-top: 10px;
}
</style>
