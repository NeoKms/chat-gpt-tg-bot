const { createParser } = require("eventsource-parser");
async function* streamAsyncIterable(stream) {
  if (!stream) {
    return;
  }
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
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
async function fetchSSE(input, options) {
  const { onMessage, onError, ...fetchOptions } = options;
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
    resp.body
  )) {
    const str = new TextDecoder().decode(chunk);
    parser.feed(str);
  }
}
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const splitToChunks = (arr, n) => {
  return arr.length ? [arr.slice(0, n), ...splitToChunks(arr.slice(n), n)] : []
};

module.exports = { fetchSSE, sleep,splitToChunks };
