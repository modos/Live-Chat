<template>
  <div>
    <div class="header">
       <div class="chat-history">
        <ul class="messages" v-if="user.messages.length !== 0">
                <li
        v-for="(message, index) in user.messages"
        :key="index"
        class="message clearfix"
      >

      <div v-bind:class="{ is_self :  message.fromSelf }" class="my-message">
        {{message.content}}
      </div>
       
      </li>
          
        </ul>
        
      </div> <!-- end chat-history -->

    </div>

          <div class="chat-message clearfix">
            <form @submit.prevent="onSubmit" class="form">
        <textarea v-model="input" class="input" name="message-to-send" id="message-to-send" placeholder ="Type your message" rows="3"></textarea>
                
        <i class="fa fa-file-o"></i> &nbsp;&nbsp;&nbsp;
        <i class="fa fa-file-image-o"></i>
        
        <button :disabled="!isValid" class="send-button">Send</button>
            </form>
      </div>

  </div>
</template>

<script>

export default {
  name: "MessagePanel",
  components: {
   
  },
  props: {
    user: Object,
  },
  data() {
    return {
      input: "",
    };
  },
  methods: {
    onSubmit() {
      this.$emit("input", this.input);
      this.input = "";
    },
    displaySender(message, index) {
      return (
        index === 0 ||
        this.user.messages[index - 1].fromSelf !==
          this.user.messages[index].fromSelf
      );
    },
  },
  computed: {
    isValid() {
      return this.input.length > 0;
    },
  },
};
</script>

<style>
.messages {
  margin: 0;
  padding: 20px;
}

.message {
  list-style: none;
}
.my-message {
  background-color: #86BB71;
    border-radius: 10px 0px 10px 10px;
    padding: 16px;
    height: max-content;
}

.is_self {
  background-color: #5f5d57 !important;
}
</style>
