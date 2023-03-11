const {fetchSSE, splitToChunks, sleep, addLog, getChatIdSystems, setChatIdSystems} = require("./src/helpers/helpers");
const config = require("./src/config");

const chatBot = new (require("./src/module/UserAPIWrapper"))();

const inProgress = new Set();
const chatIdSystems = getChatIdSystems();

chatBot.getBot().updates.on("updateShortMessage", async (msg) => {
  if (!msg?.message?.length) return;
  addLog(JSON.stringify(msg, null, 2));
  if (inProgress.has(msg.user_id)) {
    return chatBot.sendMessage(msg.user_id, "Подождите завершения предыдущего запроса");
  }
  inProgress.add(msg.user_id);
  const isBotCommand = msg.message[0] === "/";
  if (!isBotCommand) {
    const data = {
      allText: "Ожидайте ответа. Обновление происходит раз в 10 секунд.\n\n",
      messageId: 0,
      chatId: msg.user_id,
      chunk: 0
    };
    await sendReq(msg.message, data);
    addLog(`Ответ на ${msg.user_id}-${msg.id}:\n${data.allText}`);
  } else {
    const command = msg.message.split(" ")[0].trim();
    const text = msg.message.replace(command,"").trim();
    if (command==="/system") {
      chatIdSystems[msg.user_id] = text;
      setChatIdSystems(chatIdSystems);
      chatBot.sendMessage(msg.user_id, "Поведение установлено");
    } else if (command==="/help") {
      chatBot.sendMessage(msg.user_id, "Можно задовать поведение бота через команду \n" +
          "/system текст поведения\n" +
          "Например можно установить, чтобы он переводил текст:\n" +
          "/system Ты помощник в переводе текста с русского на японский");
    }
  }
  inProgress.delete(msg.user_id);
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
    messages: [
      {role: "user", content: text},
    ],
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

      if (data.allText.length && !msgSended) {
        msgSended = true;
        const res = await chatBot.sendMessage(
          data.chatId,
          data.allText,
        );
        data.messageId = res.id;
      } else if (data.allText.length && data.messageId > 0) {
        const chunks = splitToChunks(data.allText, 4000);
        let nowText = chunks[data.chunk];
        if (nowText.length===4000 && chunks.length>data.chunk+1 && chunks[data.chunk+1].length) {
          chatBot.editMessageTextImmediately(
            nowText,
            data.messageId,
            data.chatId,
            true,
          );
          data.messageId = 0;
          data.chunk++;
          nowText = chunks[data.chunk];
          const res = await chatBot.sendMessage(
            data.chatId,
            nowText,
          );
          data.messageId = res.id;
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
  data.allText += "\n\nОтвет закончен.";
  data.allText = data.allText.replace("Ожидайте ответа. Обновление происходит раз в 10 секунд.\n\n","");
  const chunks = splitToChunks(data.allText, 4000);
  const nowText = chunks[data.chunk];
  while (!data.messageId) {
    await sleep(1000);
  }
  await chatBot.editMessageTextImmediately(
    nowText,
    data.messageId,
    data.chatId,
    true,
  );
};
