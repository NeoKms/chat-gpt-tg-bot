const i18n = require("i18n");
const pathModule = require("path");
const {APP_LOCALE} = require("../config");

i18n.configure({
  directory: pathModule.join(__dirname, "locales"),
  defaultLocale: APP_LOCALE,
  objectNotation: true,
});
i18n.t = i18n.__;

module.exports = i18n;

