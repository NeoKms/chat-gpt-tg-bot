[![Qodana](https://github.com/NeoKms/chat-gpt-tg-bot/actions/workflows/qodana.yml/badge.svg?branch=main)](https://github.com/NeoKms/chat-gpt-tg-bot/actions/workflows/qodana.yml)
[![Dockerhub](https://github.com/NeoKms/chat-gpt-tg-bot/actions/workflows/build-and-push.yml/badge.svg?branch=main)](https://hub.docker.com/repository/docker/upachko/chat-gpt-tg-bot/general)
[![Latest Stable Version](https://img.shields.io/github/v/release/neokms/chat-gpt-tg-bot)](https://github.com/NeoKms/chat-gpt-tg-bot/releases)
<img src="https://raw.githubusercontent.com/NeoKms/my-static/main/chatGPT.gif" width="800" >

## Приложение для запуска чат-бота для Telegram на основе ChatGPT 

Может работать в двух режимах
1. От лица пользователя
2. От лица бота

## Запуск
### 1. Бот
1. Получить [токен бота](https://t.me/BotFather)
2. Получить [OpenAI API key](https://platform.openai.com/account/api-keys)
3. Добавить их в env ```docker-compose.yaml```
4. Выполнить ```docker-compose up -d```

### 2. Пользователь
1. Получить [API_HASH и API_ID](https://my.telegram.org/)
2. Получить [OpenAI API key](https://platform.openai.com/account/api-keys)
3. Добавить их и номер телефона в env ```docker-compose.yaml```
4. Выполнить ```docker-compose up -d```
5. Выполнить ```docker exec -it openaibot sh -c "cd /var/www/app && node tglogin.js"``` и ввести код авторизации
6. Выполнить ```docker exec -it openaibot sh -c "pm2 restart all"```

## Возможности 
Для получения помощи отправить ```/help```

Для установки поведения отправить ```/system поведение``` или во время отправки сообщения ```поведение/system/текст сообщения``` (в данном случае история сообщений не сохраняется, чтобы не портить заданный контекст). Например, можно установить, чтобы он переводил текст: ```/system Ты помощник в переводе текста с русского на японский```

Для включения режима запоминания истории (режим "чата") ```/history```. В данном режиме бот будет запоминать все сообщения и отвечать учитывая предыдущие сообщения. Вызов команды отчищает сохраненную в базе историю сообщений.

Для принудительной отчистки истории ```/clear_history```

## Дополнительные переменные окружения
1. TIMEOUT_MSG_EDIT - Время между обновлением (изменением сообщения) ответа в реальном времени. Маленькие значения могут приводить ко временной блокировки по флуду.
2. APP_LOCALE - Язык приложения. Доступны en и ru.

## Application for launching a chat bot for Telegram based on ChatGPT

Can work in two modes
1. On behalf of the user
2. On behalf of the bot

## Run
### 1. Bot
1. Get a [bot token](https://t.me/BotFather)
2. Get [OpenAI API key](https://platform.openai.com/account/api-keys)
3. Add them to env ```docker-compose.yaml```
4. Run ```docker-compose up -d```

### 2. User
1. Get [API_HASH and API_ID](https://my.telegram.org/)
2. Get [OpenAI API key](https://platform.openai.com/account/api-keys)
3. Add them and phone number to env ```docker-compose.yaml```
4. Run ```docker-compose up -d```
5. Run ```docker exec -it openaibot sh -c "cd /var/www/app && node tglogin.js"``` and enter the authorization code
6. Run ```docker exec -it openaibot sh -c "pm2 restart all"```

## Possibilities
For help send ```/help```

To set the behavior, send ```/system behavior``` or while sending a message ```behavior/system/message text``` (in this case, the message history is not saved so as not to spoil the given context). For example, you can set it to translate text: ```/system You are an assistant in translating text from English to Japanese```

To enable the history memorization mode ("chat mode") ```/history```. In this mode, the bot will remember all messages and respond taking into account previous messages. Calling the command clears the history of messages stored in the database.

To force clear history ```/clear_history```

## Additional environment variables
1. TIMEOUT_MSG_EDIT - The time between updating (changing a message) a response in real time. Small values can lead to a temporary flood block.
2. APP_LOCALE - Application language. en and ru are available.
