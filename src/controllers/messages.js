const DB = require("../db");
const {addLog, prepareMessage} = require("../helpers/helpers");
const OpenAIController = require("./open_ai");
const {defaultTexts} = require("../helpers/constants");
const messages = {};

const inProgress = new Set();

messages.onMessage = async function (msg) {
  if (!["UserAPIWrapper","BotAPIWrapper"].includes(this?.constructor?.name)) {
    throw new Error("Не был установлен APIWrapper .bind()");
  }
  msg = prepareMessage(msg);
  if (!msg?.message?.length) return;
  if (msg.out) return;
  const uid = msg.user_id;
  const db = new DB(uid);
  addLog(JSON.stringify(msg, null, 2));
  if (inProgress.has(uid)) {
    return this.sendMessage(uid, "Подождите завершения предыдущего запроса");
  }
  inProgress.add(uid);
  const isBotCommand = msg.message[0] === "/";
  if (!isBotCommand) {
    const data = {
      allText: defaultTexts.start,
      messageId: 0,
      chatId: uid,
      chunk: 0
    };
    await OpenAIController.sendReq.bind(this)(msg.message.trim(), data, db)
      .finally(() => inProgress.delete(uid));
    if (msg.message.indexOf("/system/") === -1 && db.getHistoryMode()) {
      db.addInHistory(
        {role: "user", content: msg.message},
        {role: "assistant", content: data.allText}
      );
    }
    addLog(`Ответ на ${uid}-${msg.id}:\n${data.allText}`);
  } else {
    const command = msg.message.split(" ")[0].trim();
    const text = msg.message.replace(command, "").trim();
    if (command === "/system") {
      db.setSystem(text);
      this.sendMessage(uid, "Поведение установлено");
    } else if (command === "/help") {
      this.sendMessage(uid, "1. Командой /system можно задавать поведение бота.\n" +
          "/system текст поведения\n" +
          "Например можно установить, чтобы он переводил текст:\n" +
          "/system Ты помощник в переводе текста с русского на японский\n\n" +
          "1. Командой /history можно включить режим \"чата\"." +
          " В данном режиме бот будет запоминать все сообщения и отвечать" +
          " учитывая предыдущие сообщения. Вызов команды отчищает сохраненную в базе историю сообщений.\n\n" +
          "1. Командой /clear_history можно принудительно отчистить сохраненную в базе историю сообщений.");
    } else if (command === "/history") {
      db.switchHistoryMode();
      this.sendMessage(uid, "Отслеживание истории" + (db.getHistoryMode() ? " включено" : " отключено"));
    } else if (command === "/clear_history") {
      db.clearHistory();
      this.sendMessage(uid, "История очищена");
    }
    inProgress.delete(uid);
  }
};
module.exports = messages;
