const {TIMEOUT_MSG_EDIT} = require("../config");
const constants = {};

constants.defaultTexts = {
  "start": `Ожидайте ответа. Обновление происходит раз в ${TIMEOUT_MSG_EDIT/1000} секунд.\n\n`,
  "end": "\n\nОтвет закончен.",
};

module.exports = constants;
