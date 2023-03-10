const { sleep,splitToChunks } = require("../helpers/helpers");
const API = require('./mtproto');

module.exports = new class BotAPIWrapper {
    canEdit = true;
    oldMessagesWasEdited = [];

    constructor(token) {}

    getBot() {
        return API.mtproto;
    }

    async sendMessage(chatId,text) {
        const chunks = splitToChunks(text, 4000);
        let res = null;
        for (let i = 0; i<chunks.length;i++) {
            res = await this.#sendMessage(chatId, chunks[i]);
        }
        return res;
    }
    async #sendMessage(chatId, text) {
        return API.call('messages.sendMessage',{
            message: text,
            random_id: Math.floor((Math.random()*100000000)+1),
            peer: {
                _: 'inputPeerUser',
                user_id: chatId,
            },
        });
    }

    async editMessageTextImmediately(text, msgId, chatId, waitUnlim = false) {
        return API.call("messages.editMessage",{
            message: text,
            id: msgId,
            peer: {
                _: 'inputPeerUser',
                user_id: chatId,
            },
        })
            .then(res=>{
                if (res?.error_message?.indexOf("FLOOD_WAIT")>=0) {
                    const sec = res.error_message.split("_")[2];
                    return sleep(sec*1000)
                        .then(()=>this.editMessageTextImmediately(text,msgId,chatId,true));
                }
            })
    }

    async editMessageText(text, msgId, chatId) {
        if (this.canEdit) {
            this.canEdit = false;
            setTimeout(() => (this.canEdit = true), 10000);
            return this.editMessageTextImmediately(text, msgId, chatId);
        }
    }
};
