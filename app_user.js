const { fetchSSE, splitToChunks, sleep} = require("./src/helpers/helpers");
const redis = require("./src/module/redis")
const config = require("./src/config");

const chatBot = require("./src/module/BotAPIWrapper");

const messagesInProgress = {};
chatBot.getBot().updates.on('updateShortMessage', async (updateInfo) => {
  console.log('updateShortMessage:', updateInfo);
  messagesInProgress[updateInfo.user_id] = true;
  const data = { allText: "", messageId: 0, chatId: updateInfo.user_id, chunk: 0 };
  await chatBot.sendMessage(data.chatId, "Ожидайте ответа. Обновление происходит раз в 10 секунд.");
  await sendReq(updateInfo.message, data);
  console.log(data);
  await chatBot.sendMessage(data.chatId, "Ответ закончен.");
  messagesInProgress[updateInfo.user_id] = false;
});

const sendReq = async (text, data) => {
  const body = {
    model: "gpt-3.5-turbo",
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
    messages: [
      // {
      //   role: "system",
      //   content: "",
      // },
      { role: "user", content: text },
    ],
    stream: true,
  };
  let isFirst = true;
  let msgSended = false;
  await fetchSSE("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.OPEN_AI_TOKEN}`,
    },
    body: JSON.stringify(body),
    onMessage: async (msg) => {
      let resp;
      try {
        resp = JSON.parse(msg);
      } catch {
        console.log("err");
        return;
      }
      const { choices } = resp;
      if (!choices || choices.length === 0) {
        return { error: "No result" };
      }
      const { delta, finish_reason: finishReason } = choices[0];
      if (finishReason) {
        console.log("finishReason", finishReason);
        return;
      }
      const { content = "", role } = delta;
      let targetTxt = content;

      if (isFirst && targetTxt && ["“", '"', "「"].indexOf(targetTxt[0]) >= 0) {
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
          data.allText
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
              true
          );
          data.messageId = 0;
          data.chunk++;
          nowText = chunks[data.chunk];
          const res = await chatBot.sendMessage(
              data.chatId,
              nowText
          );
          data.messageId = res.id;
        } else {
          data.messageId && chatBot.editMessageText(nowText, data.messageId, data.chatId);
        }
      }
    },
    onError: (err) => {
      const { error } = err;
      console.log("on error", error.message);
    },
  });
  const chunks = splitToChunks(data.allText, 4000);
  let nowText = chunks[data.chunk];
  if (!data.messageId) {
    await sleep(4000);
  }
  await chatBot.editMessageTextImmediately(
      nowText,
      data.messageId,
      data.chatId,
      true
  );
};
