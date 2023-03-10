const MTProto = require('@mtproto/core');
const {TG} = require('../../src/config')
const path = require('path')

TG.storageOptions = {
    path: path.resolve(__dirname, '../../tgdata/1.json'),
}

const api = new MTProto(TG);
const contacts = new Map();

function sendCode(phone) {
    return api.call('auth.sendCode', {
        phone_number: phone,
        settings: {
            _: 'codeSettings',
        },
    });
}

function importContacts(phone) {
    return api.call('contacts.importContacts', {
        contacts:[{
            _: 'inputPhoneContact',
            client_id: 0,
            phone,
            first_name: '',
            last_name: '',
        }],
    });
}

function getContants(phone) {
    return api.call('contacts.getContacts');
}

function send(userId, message) {
    return api.call('messages.sendMessage',{
        message,
        random_id: Math.floor((Math.random()*100000000)+1),
        peer: {
            _: 'inputPeerUser',
            user_id: userId,
        },
    });
}

function checkLogin() {
    return api.call('users.getFullUser', {
        id: {
            _: 'inputUserSelf',
        },
    });
}

function signIn(code, phone, phone_code_hash) {
    return api.call('auth.signIn', {
        phone_code: code,
        phone_number: phone,
        phone_code_hash,
    });
}

async function sendMessage(phone, message) {
    try {
        let user = contacts.get(phone);
        if (!user) {
            const ic = await importContacts(phone);
            if (ic && ic.imported && ic.imported.length>0 && ic.imported[0].user_id) {
                user = ic.imported[0].user_id;
                contacts.set(phone, user);
            }
        }
        return await api.call('messages.sendMessage',{
            message,
            random_id: Math.floor((Math.random()*100000000)+1),
            peer: {
                _: 'inputPeerUser',
                user_id: user,
            },
        });
    } catch (error) {
        console.error('tg/sendMessage', error);
        throw error;
    }
}

module.exports = {
    api,
    checkLogin,
    signIn,
    sendMessage,
    sendCode,
};
