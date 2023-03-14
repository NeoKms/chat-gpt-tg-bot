const {splitToChunks} = require("../helpers/helpers");
const API = require("./mtproto");
const {TIMEOUT_MSG_EDIT} = require("../config");

module.exports = class UserAPIWrapper extends API {
  canEdit = true;

  constructor() {
    super();
  }

  getBot() {
    return this.mtproto.updates;
  }

  async sendMessage(chatId, text) {
    const chunks = splitToChunks(text, 4000);
    const res = {id: null, arr: []};
    for (let i = 0; i<chunks.length; i++) {
      const msg = await this.#sendMessage(chatId, chunks[i]);
      res.arr.push(msg);
      res.id = msg.id;
    }
    return res;
  }
  async #sendMessage(chatId, text) {
    return this.call("messages.sendMessage", {
      message: text,
      random_id: Math.floor((Math.random() * 100000000) + 1),
      peer: {
        _: "inputPeerUser",
        user_id: chatId,
      },
    })
      .catch((err) => ({id: -1, message: "error", error: err.message}));
  }

  async editMessageTextImmediately(text, msgId, chatId, waitUnlim = false) {
    return this.call("messages.editMessage", {
      message: text,
      id: msgId,
      peer: {
        _: "inputPeerUser",
        user_id: chatId,
      },
      waitUnlim,
    })
      .catch((err) => ({id: -1, error: err.message}));
  }

  async editMessageText(text, msgId, chatId) {
    if (this.canEdit) {
      this.canEdit = false;
      setTimeout(() => (this.canEdit = true), TIMEOUT_MSG_EDIT);
      return this.editMessageTextImmediately(text, msgId, chatId);
    }
  }
};
