const {fetchSSE, splitToChunks, sleep} = require("../helpers/helpers");
const config = require("../config");
const i18n = require("../i18n");

const open_ai = {};

open_ai.sendReq = async function (text, data, db) {
  if (!["UserAPIWrapper","BotAPIWrapper"].includes(this?.constructor?.name)) {
    throw new Error(i18n.t("errors.api_bind"));
  }
  const splitted = text.split("/system/");
  const messages = [];
  if (splitted.length === 2) {
    messages.push(
      {role: "system", content: splitted[0].trim()},
    );
    text = splitted[1].trim();
  } else if (db.getSystem()?.length) {
    messages.push({role: "system", content: db.getSystem()});
  }
  if (db.getHistoryMode() && db.getHistory()?.length) {
    messages.push(...db.getHistory());
  }
  messages.push({role: "user", content: text});
  let isFirst = true;
  let msgSent = false;
  await fetchSSE("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.OPEN_AI_TOKEN}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
      messages: messages,
      stream: true,
    }),
    onMessage: (msg) => {
      let resp;
      try {
        resp = JSON.parse(msg);
      } catch {
        return;
      }
      const {choices} = resp;
      if (!choices || choices.length === 0) {
        return {error: "No result"};
      }
      const {delta, finish_reason: finishReason} = choices[0];
      if (finishReason) {
        return;
      }
      const {content = "", role} = delta;
      let targetTxt = content;
      if (isFirst && targetTxt && ["“", "\"", "「"].indexOf(targetTxt[0]) >= 0) {
        targetTxt = targetTxt.slice(1);
      }
      if (!role) {
        isFirst = false;
      }
      data.allText += targetTxt;
      if (data.allText.length && !msgSent) {
        msgSent = true;
        this.sendMessage(
          data.chatId,
          data.allText,
        ).then((res) => {
          data.messageId = res.id;
        });
      } else if (data.allText.length && data.messageId > 0) {
        const chunks = splitToChunks(data.allText, 4000);
        let nowText = chunks[data.chunk];
        if (nowText.length === 4000 && chunks.length > data.chunk + 1 && chunks[data.chunk + 1].length) {
          this.editMessageTextImmediately(
            nowText,
            data.messageId,
            data.chatId,
            true,
          );
          data.messageId = 0;
          data.chunk++;
          nowText = chunks[data.chunk];
          this.sendMessage(
            data.chatId,
            nowText,
          ).then((res) => {
            data.messageId = res.id;
          });
        } else {
          data.messageId && this.editMessageText(nowText, data.messageId, data.chatId);
        }
      }
    },
    onError: (err) => {
      const {error} = err;
      console.log("on error", error.message);
    },
  });
  data.allText += i18n.t("messages.end_ai");
  data.allText = data.allText.replace(i18n.t("messages.start_ai",{time: config.TIMEOUT_MSG_EDIT/1000}), "");
  const chunks = splitToChunks(data.allText, 4000);
  const nowText = chunks[data.chunk];
  while (!data.messageId) {
    await sleep(1000);
  }
  await this.editMessageTextImmediately(
    nowText,
    data.messageId,
    data.chatId,
    true,
  );
  data.allText = data.allText.replace(i18n.t("messages.end_ai"), "");
};
module.exports = open_ai;
