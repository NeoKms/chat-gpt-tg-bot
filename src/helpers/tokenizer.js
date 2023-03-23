const {encoding_for_model} = require("@dqbd/tiktoken");

module.exports = (text) => {
  const enc = encoding_for_model("gpt-3.5-turbo");
  const tokens = enc.encode(text);
  enc.free();
  return tokens;
};
