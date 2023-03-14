const TelegramBot = require("node-telegram-bot-api");
const {sleep, splitToChunks} = require("../helpers/helpers");
const {BOT_TOKEN,TIMEOUT_MSG_EDIT} = require("../config");

module.exports = class BotAPIWrapper {
  bot = null;
  canEdit = true;

  constructor() {
    this.bot = new TelegramBot(BOT_TOKEN, {polling: true});
  }

  getBot() {
    return this.bot;
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
    return this.bot
      .sendMessage(chatId, text)
      .then((result) => ({
        id: result.message_id
      }))
      .catch((err) => {
        if (
          err?.response?.body?.description?.indexOf("Too Many Requests") !== -1
        ) {
          return sleep(err.response.body.retry_after * 1000).then(() =>
            this.sendMessage(chatId, text),
          );
        } else {
          return {message: "error", error: err.message, id: -1};
        }
      });
  }

  async editMessageTextImmediately(text, msgId, chatId, waitUnlim = false) {
    return this.bot
      .editMessageText(text, {
        message_id: msgId,
        chat_id: chatId,
      })
      .then((result) => ({message: "ok", result}))
      .catch((err) => {
        if (
          waitUnlim &&
                    err?.response?.body?.description?.indexOf("Too Many Requests") !== -1
        ) {
          return sleep(err.response.body.retry_after * 1000).then(() =>
            this.editMessageText(text, msgId, chatId),
          );
        } else {
          return {message: "error", error: err.message};
        }
      });
  }

  async editMessageText(text, msgId, chatId) {
    if (this.canEdit) {
      this.canEdit = false;
      setTimeout(() => (this.canEdit = true), TIMEOUT_MSG_EDIT);
      return this.editMessageTextImmediately(text, msgId, chatId);
    }
  }
};
