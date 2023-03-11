const prompt = require("prompt");
process.env.MTPROTO_LOG_ALL = "false";
const UserAPIWrapper = new (require("./src/module/UserAPIWrapper"))();

UserAPIWrapper.checkLogin()
  .then(async ()=>{
    console.log("TG logged");
  })
  .catch(()=>
    UserAPIWrapper.sendCode()
      .then(async res=>{
        prompt.start();
        const promptObj = await prompt.get([{name: "code"}]);
        prompt.stop();
        await UserAPIWrapper.signIn(promptObj.code, res.phone_code_hash);
        console.log("Login OK");
      })
      .catch(err=>console.log("Login error", err))
  )
  .finally(()=>process.exit());
