const {resolve} = require("path");
const {env} = process;

require("dotenv").config({path: resolve(__dirname + "/../../.env")});

const config = {};

config.BOT_TOKEN = env.BOT_TOKEN;
config.OPEN_AI_TOKEN = env.OPEN_AI_TOKEN;

config.TG = {
  api_id: env.API_ID,
  api_hash: env.API_HASH,
  phone: env.PHONE,
  storageOptions: {
    path: resolve(__dirname + "/../../tgdata/1.json"),
  },
};

config.REDIS_SETTINGS = {
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
};
module.exports = config;
