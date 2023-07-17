const {resolve} = require("path");
const {env} = process;

require("dotenv").config({path: resolve(__dirname + "/../../.env")});

const config = {};

config.BOT_TOKEN = env.BOT_TOKEN;
config.OPEN_AI_TOKEN = env.OPEN_AI_TOKEN;

config.TG = {
  api_id: env?.API_ID,
  api_hash: env?.API_HASH,
  phone: env?.PHONE,
  storageOptions: {
    path: resolve(__dirname + "/../../tgdata/1.json"),
  },
};

config.REDIS_SETTINGS = {
  host: env?.REDIS_HOST,
  port: parseInt(env?.REDIS_PORT),
};

config.IS_BOT = !!config.BOT_TOKEN;

config.TIMEOUT_MSG_EDIT = parseInt(env.TIMEOUT_MSG_EDIT ?? 10000);

config.APP_LOCALE = env.APP_LOCALE ?? "ru";

config.MAX_MSG_TOKENS = env.MAX_MSG_TOKENS ?? 3000;

/* https://platform.openai.com/docs/api-reference/chat/create */
config.MODEL_CONFIG = {
  maximum_tokens: 8192,//MAX_MSG_TOKENS+answer
  body: {}
};
config.MODEL_CONFIG.body = {
  model: "gpt-4",
  temperature: 0,
  max_tokens: config.MODEL_CONFIG.maximum_tokens - config.MAX_MSG_TOKENS,//answer
  top_p: 1,
  frequency_penalty: 1,
  presence_penalty: 1,
};

module.exports = config;
