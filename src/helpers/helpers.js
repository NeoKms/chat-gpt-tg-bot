const {createParser} = require("eventsource-parser");
const fsSync = require("fs");
const fs = fsSync.promises;

const helpers = {};
helpers.formatDateJS = (t, m) => {
  if (!m) m = "YYYY-MM-DD hh:mm:ss";
  const d = new Date(t * 1000);
  const mmmm = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  m = m.replace("YYYY", d.getUTCFullYear());
  m = m.replace("YY", (d.getUTCFullYear() % 100 > 9 ? "" : "0") + d.getUTCFullYear() % 100);
  m = m.replace("MMMM", mmmm[d.getUTCMonth()]);
  m = m.replace("MM", ((d.getUTCMonth() + 1) > 9 ? "" : "0") + (d.getUTCMonth() + 1));
  m = m.replace("DD", (d.getUTCDate() > 9 ? "" : "0") + d.getUTCDate());
  m = m.replace("hh", (d.getUTCHours() > 9 ? "" : "0") + d.getUTCHours());
  m = m.replace("mm", (d.getUTCMinutes() > 9 ? "" : "0") + d.getUTCMinutes());
  m = m.replace("ss", (d.getUTCSeconds() > 9 ? "" : "0") + d.getUTCSeconds());
  return m;
};
helpers.getUnixTime = (date, form) => {
  let format = form ? form : "YYYY-MM-DD hh:mm:ss";
  let Y = date.substring(format.indexOf("Y"), format.lastIndexOf("Y") + 1);
  let M = date.substring(format.indexOf("M"), format.lastIndexOf("M") + 1);
  let D = date.substring(format.indexOf("D"), format.lastIndexOf("D") + 1);
  let h = date.substring(format.indexOf("h"), format.lastIndexOf("h") + 1);
  let m = date.substring(format.indexOf("m"), format.lastIndexOf("m") + 1);
  let s = date.substring(format.indexOf("s"), format.lastIndexOf("s") + 1);
  if (Y.length < 4) {
    Y = "200".substring(0, 4 - Y.length) + "" + Y;
  }
  if (Y.match(/^\d+$/) && M.match(/^\d+$/) && D.match(/^\d+$/) && h.match(/^\d+$/) && m.match(/^\d+$/) && s.match(/^\d+$/)) {
    Y = parseInt(Y);
    M = parseInt(M);
    D = parseInt(D);
    h = parseInt(h);
    m = parseInt(m);
    s = parseInt(s);
    if (s >= 0 && s < 60 && m >= 0 && m < 60 && h >= 0 && h < 24 && D > 0 && D <= 31 && M > 0 && M <= 12) {
      if (Y > 2100) Y = 2100;
      const feb = IsLeapYear(Y) ? 29 : 28;
      if ((M == 2 && D > feb) || (D > 30 && (M == 4 || M == 6 || M == 9 || M == 11))) return false;
      // IsLeapYear(year)
      format = Date.UTC(Y, M - 1, D, h, m, s) / 1000;
      return format;
    }
    return false;
  }
  return false;
};

function IsLeapYear(year) {
  if (year % 4 == 0) {
    if (year % 100 == 0) {
      if (year % 400 == 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
  return false;
}

async function* streamAsyncIterable(stream) {
  if (!stream) {
    return;
  }
  const reader = stream.getReader();
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

const streamAsyncIterator = {
  [Symbol.asyncIterator]: streamAsyncIterable,
};
helpers.fetchSSE = async (input, options) => {
  const {onMessage, onError, ...fetchOptions} = options;
  const resp = await fetch(input, fetchOptions);
  if (resp.status !== 200) {
    onError(await resp.json());
    return;
  }
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });
  for await (const chunk of streamAsyncIterator[Symbol.asyncIterator](
    resp.body,
  )) {
    const str = new TextDecoder().decode(chunk);
    parser.feed(str);
  }
};
helpers.sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
helpers.splitToChunks = (arr, n) => {
  return arr.length ? [arr.slice(0, n), ...helpers.splitToChunks(arr.slice(n), n)] : [];
};
helpers.addLog = (text) => {
  fs.appendFile("logs.txt", `[${helpers.formatDateJS((new Date() / 1000) + 3600 * 3, "DD.MM.YYYY hh:mm:ss")}]\n${text}\n`)
    .catch((err) => console.log("error in helpers.addLog", err.message));
};
helpers.getDB = () => {
  try {
    return JSON.parse(fsSync.readFileSync("./db.json", "utf-8") || {});
  } catch (err) {
    if (err.message.indexOf("no such file")!==-1) {
      return {};
    }
  }
};
helpers.setDB = (data) => {
  return fsSync.writeFileSync("./db.json",JSON.stringify(data,null,2));
};

module.exports = helpers;
