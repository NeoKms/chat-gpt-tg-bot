const {TG} = require('./src/config');

const prompt = require('prompt');
const tg = require('./src/helpers/tg');

//
async function get() {
    prompt.start();
    return (await prompt.get([{ name: 'code' }])).code;
}
//
tg.checkLogin().then(async(r)=>{
    console.log('TG logged');
}).catch(e => {
    return tg.sendCode(TG.phone).then(async (res)=>{
        console.log("res",res);
        const b = await get(); prompt.stop();
        await tg.signIn(b, TG.phone, res.phone_code_hash);
        console.log('Login OK');
    }).catch(e => {
        console.error('Error', e);
    });
})
    // .finally(()=>process.exit());
