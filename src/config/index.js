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

const MAX_MSG_TOKENS = env.MAX_MSG_TOKENS ?? 3000;
config.MAX_MSG_TOKENS = MAX_MSG_TOKENS > 3000 ? 3000 : env.MAX_MSG_TOKENS;

/* https://platform.openai.com/docs/api-reference/chat/create */
config.MODEL_CONFIG = {
  maximum_tokens: 4097,//MAX_MSG_TOKENS+answer
  body: {
    model: "gpt-3.5-turbo",
    temperature: 0,
    max_tokens: 4097 - config.MAX_MSG_TOKENS,//answer
    top_p: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
  }
};
const version = +process.env.MODEL_VERSION;
if (version === 4) {
  config.MAX_MSG_TOKENS = MAX_MSG_TOKENS > 6000 ? 6000 : env.MAX_MSG_TOKENS;
  config.MODEL_CONFIG.maximum_tokens = 8192;
  config.body.model = "gpt-4";
  config.body.max_tokens = 8192 - config.MAX_MSG_TOKENS;
}
module.exports = config;
