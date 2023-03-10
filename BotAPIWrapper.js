const TelegramBot = require("node-telegram-bot-api");
const {sleep} = require("./src/helpers/helpers");

module.exports = class BotAPIWrapper {
    bot = null;
    canEdit = true;

    constructor(token) {
        this.bot = new TelegramBot(token, {polling: true});
    }

    getBot() {
        return this.bot;
    }

    async sendMessage(chatId, text) {
        return this.bot
            .sendMessage(chatId, text)
            .then((result) => ({message: "ok", result}))
            .catch((err) => {
                if (
                    err?.response?.body?.description?.indexOf("Too Many Requests") !== -1
                ) {
                    return sleep(err.response.body.retry_after * 1000).then(() =>
                        this.sendMessage(chatId, text)
                    );
                } else {
                    return {message: "error", error: err.message};
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
                        this.editMessageText(text, msgId, chatId)
                    );
                } else {
                    return {message: "error", error: err.message};
                }
            });
    }

    async editMessageText(text, msgId, chatId) {
        if (this.canEdit) {
            this.canEdit = false;
            setTimeout(() => (this.canEdit = true), 1000);
            return this.editMessageTextImmediately(text, msgId, chatId);
        }
    }
};
