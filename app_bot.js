const {fetchSSE, splitToChunks, sleep, addLog, getChatIdSystems, setChatIdSystems} = require("./src/helpers/helpers");
const config = require("./src/config");
const BotAPIWrapper = require("./src/module/BotAPIWrapper");
const chatBot = new BotAPIWrapper(config.BOT_TOKEN);

const chatIdSystems = getChatIdSystems();
const inProgress = new Set();
chatBot.getBot().on("message", async (msg) => {
  if (!msg?.text?.length) return;
  // log
  const msgToLog = JSON.parse(JSON.stringify(msg));
  delete msgToLog.chat;
  msgToLog.from.chat_id = msg.chat.id;
  addLog(JSON.stringify(msgToLog, null, 2));
  // log end
  if (inProgress.has(msg.chat.id)) {
    return chatBot.sendMessage(msg.chat.id, "Подождите завершения предыдущего запроса");
  }
  inProgress.add(msg.chat.id);
  if (!msg?.entities?.length) {
    const data = {allText: "", messageId: 0, chatId: msg.chat.id, chunk: 0};
    await sendReq(msg.text, data);
    addLog(`Ответ на [${msgToLog.from.username}]${msgToLog.from.chat_id}-${msgToLog.message_id}:\n${data.allText}`);
  } else if (msg?.entities[0].type==="bot_command") {
    const command = msg.text.slice(0, msg.entities[0].length);
    const text = msg.text.replace(command, "").trim();
    if (command==="/system") {
      chatIdSystems[msg.chat.id] = text;
      setChatIdSystems(chatIdSystems);
      chatBot.sendMessage(msg.chat.id, "Поведение установлено");
    } else if (command==="/help") {
      chatBot.sendMessage(msg.chat.id, "Можно задовать поведение бота через команду \n" +
                "/system текст поведения\n" +
                "Например можно установить, чтобы он переводил текст:\n" +
                "/system Ты помощник в переводе текста с русского на японский");
    }
  }
  inProgress.delete(msg.chat.id);
});
const sendReq = async (text, data) => {
  const splitted = text.split("/system/");
  const messages = [];
  if (splitted.length === 2) {
    messages.push(
      {role: "system", content: splitted[0].trim()},
      {role: "user", content: splitted[1].trim()},
    );
  } else {
    if (chatIdSystems[data.chatId]) {
      messages.push(
        {role: "system", content: chatIdSystems[data.chatId]},
      );
    }
    messages.push(
      {role: "user", content: splitted[0].trim()},
    );
  }
  const body = {
    model: "gpt-3.5-turbo",
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
    messages,
    stream: true,
  };
  let isFirst = true;
  let msgSended = false;
  await fetchSSE("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.OPEN_AI_TOKEN}`,
    },
    body: JSON.stringify(body),
    onMessage: async (msg) => {
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
        console.log("finishReason", finishReason);
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

      if (data.allText.trim().length && !msgSended) {
        msgSended = true;
        chatBot.sendMessage(
          data.chatId,
          data.allText,
        ).then((res)=>{
          data.messageId = res?.result?.message_id || 0;
        });
      } else if (data.allText.length && data.messageId > 0) {
        const chunks = splitToChunks(data.allText, 4000);
        let nowText = chunks[data.chunk];
        if (nowText.length === 4000 && chunks.length>data.chunk+1 && chunks[data.chunk+1].length) {
          console.log("TOO LONG");
          chatBot.editMessageTextImmediately(
            nowText,
            data.messageId,
            data.chatId,
            true,
          );
          data.messageId = 0;
          data.chunk++;
          nowText = chunks[data.chunk];
          chatBot.sendMessage(
            data.chatId,
            nowText,
          ).then((res)=>{
            console.log("new mess", res);
            data.messageId = res?.result?.message_id || 0;
          });
        } else {
          data.messageId && chatBot.editMessageText(nowText, data.messageId, data.chatId);
        }
      }
    },
    onError: (err) => {
      const {error} = err;
      console.log("on error", error.message);
    },
  });
  const chunks = splitToChunks(data.allText, 4000);
  const nowText = chunks[data.chunk];
  if (!data.messageId) {
    await sleep(4000);
  }
  await chatBot.editMessageTextImmediately(
    nowText,
    data.messageId,
    data.chatId,
    true,
  );
};
