const MessagesController = require("./src/controllers/messages");
const UserAPIWrapper = require("./src/module/UserAPIWrapper");
const BotAPIWrapper = require("./src/module/BotAPIWrapper");
const {IS_BOT} = require("./src/config");

const chatBot = IS_BOT ? new BotAPIWrapper() : new UserAPIWrapper();
const listener = IS_BOT ? "message" : "updateShortMessage";

chatBot.getBot().on(listener, MessagesController.onMessage.bind(chatBot));
