const DB = require("../db");
const {addLog, prepareMessage} = require("../helpers/helpers");
const OpenAIController = require("./open_ai");
const {TIMEOUT_MSG_EDIT} = require("../config");
const i18n = require("../i18n");
const messages = {};

const inProgress = new Set();

messages.onMessage = async function (msg) {
  if (!["UserAPIWrapper","BotAPIWrapper"].includes(this?.constructor?.name)) {
    throw new Error(i18n.t("errors.api_bind"));
  }
  msg = prepareMessage(msg);
  if (!msg?.message?.length) return;
  if (msg.out) return;
  const uid = msg.user_id;
  const db = new DB(uid);
  addLog(JSON.stringify(msg, null, 2));
  if (inProgress.has(uid)) {
    return this.sendMessage(uid, i18n.t("messages.wait"));
  }
  inProgress.add(uid);
  const isBotCommand = msg.message[0] === "/";
  if (!isBotCommand) {
    const data = {
      allText: i18n.t("messages.start_ai",{time: TIMEOUT_MSG_EDIT/1000}),
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
    addLog(`${i18n.t("logs.answer")} ${uid}-${msg.id}:\n${data.allText}`);
  } else {
    const command = msg.message.split(" ")[0].trim();
    const text = msg.message.replace(command, "").trim();
    if (command === "/system") {
      db.setSystem(text);
      this.sendMessage(uid, i18n.t("messages.system_set"));
    } else if (command === "/help") {
      this.sendMessage(uid, i18n.t("messages.help"));
    } else if (command === "/history") {
      db.switchHistoryMode();
      this.sendMessage(uid, `${i18n.t("messages.history")} ${db.getHistoryMode() ? i18n.t("on") : i18n.t("off")}`);
    } else if (command === "/clear_history") {
      db.clearHistory();
      this.sendMessage(uid, i18n.t("messages.history_clear"));
    }
    inProgress.delete(uid);
  }
};
module.exports = messages;
