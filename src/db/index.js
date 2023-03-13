const {getDB, saveDB} = require("../helpers/helpers");
const dbData = getDB();

module.exports = class DB {
  constructor(uid) {
    if (!uid) throw new Error("Не передан ID пользователя");
    this.uid = uid;
  }

  getHistoryMode() {
    return !!dbData.historyMode[this.uid] ?? false;
  }

  switchHistoryMode() {
    this.clearHistory();
    dbData.historyMode[this.uid] = !dbData.historyMode[this.uid];
    saveDB(dbData);
  }

  addInHistory(...msg) {
    dbData.history[this.uid].push(...msg);
    saveDB(dbData);
  }

  getHistory() {
    return dbData.history[this.uid] ?? [];
  }

  clearHistory() {
    dbData.history[this.uid] = [];
    saveDB(dbData);
  }

  getSystem() {
    return dbData.chatIdSystems[this.uid] ?? "";
  }

  setSystem(system) {
    dbData.chatIdSystems[this.uid] = system;
    saveDB(dbData);
  }
};
