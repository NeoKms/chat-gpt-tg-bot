const path = require("path");
const MTProto = require("@mtproto/core");
const {sleep} = require("../helpers/helpers");
const {TG} = require("../config");
const MTPROTO_LOG_ALL = process.env.MTPROTO_LOG_ALL ?? "true";

class API {
  sendCode() {
    return this.call("auth.sendCode", {
      phone_number: TG.phone,
      settings: {
        _: "codeSettings",
      },
    });
  }
  signIn(code, phone_code_hash) {
    return this.call("auth.signIn", {
      phone_code: code,
      phone_number: TG.phone,
      phone_code_hash,
    });
  }
  checkLogin() {
    return this.call("users.getFullUser", {
      id: {
        _: "inputUserSelf",
      },
    });
  }

  constructor() {
    this.mtproto = new MTProto({
      api_id: TG.api_id,
      api_hash: TG.api_hash,
      storageOptions: {
        path: path.resolve(__dirname, "../../tgdata/1.json"),
      },
    });
    this.checkLogin().catch(()=>{});
  }

  async call(method, params, options = {}) {
    try {
      const result = await this.mtproto.call(method, params, options);
      return result;
    } catch (error) {
      const waitUnlim = params.waitUnlim ?? true;
      MTPROTO_LOG_ALL==="true" && console.log(`${method} error:`, error);

      const {error_code, error_message} = error;

      if (error_code === 420 && waitUnlim) {
        const seconds = Number(error_message.split("FLOOD_WAIT_")[1]);
        const ms = seconds * 1000;
        await sleep(ms);

        return this.call(method, params, options);
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split("_MIGRATE_");

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === "PHONE") {
          await this.mtproto.setDefaultDc(dcId);
        } else {
          Object.assign(options, {dcId});
        }

        return this.call(method, params, options);
      }

      return Promise.reject(error);
    }
  }
}

module.exports = API;
