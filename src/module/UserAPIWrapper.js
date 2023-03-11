const {sleep, splitToChunks} = require("../helpers/helpers");
const API = require("./mtproto");
const {TG} = require("../config");

module.exports = class UserAPIWrapper {
  canEdit = true;

  getBot() {
    return API.mtproto;
  }

  sendCode() {
    return API.call("auth.sendCode", {
      phone_number: TG.phone,
      settings: {
        _: "codeSettings",
      },
    });
  }
  signIn(code, phone_code_hash) {
    return API.call("auth.signIn", {
      phone_code: code,
      phone_number: TG.phone,
      phone_code_hash,
    });
  }
  checkLogin() {
    return API.call("users.getFullUser", {
      id: {
        _: "inputUserSelf",
      },
    });
  }

  async sendMessage(chatId, text) {
    const chunks = splitToChunks(text, 4000);
    let res = null;
    for (let i = 0; i<chunks.length; i++) {
      res = await this.#sendMessage(chatId, chunks[i]);
    }
    return res;
  }
  async #sendMessage(chatId, text) {
    return API.call("messages.sendMessage", {
      message: text,
      random_id: Math.floor((Math.random()*100000000)+1),
      peer: {
        _: "inputPeerUser",
        user_id: chatId,
      },
    });
  }

  async editMessageTextImmediately(text, msgId, chatId, waitUnlim = false) {
    return API.call("messages.editMessage", {
      message: text,
      id: msgId,
      peer: {
        _: "inputPeerUser",
        user_id: chatId,
      },
    })
      .then((res)=>{
        if (res?.error_message?.indexOf("FLOOD_WAIT")>=0 && waitUnlim) {
          const sec = Number(res.error_message.split("FLOOD_WAIT_")[1]);
          return sleep(sec*1000)
            .then(()=>this.editMessageTextImmediately(text, msgId, chatId, true));
        }
      });
  }

  async editMessageText(text, msgId, chatId) {
    if (this.canEdit) {
      this.canEdit = false;
      setTimeout(() => (this.canEdit = true), 10000);
      return this.editMessageTextImmediately(text, msgId, chatId);
    }
  }
};
