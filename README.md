## Приложение для запуска чат-бота для Telegram на основе ChatGPT 

Может работать в двух режимах
1. От лица пользователя
2. От лица бота

## Запуск
### 1. Бот
1. Получить токен бота
2. Получить api-key OpenAI
3. Добавить их в env ```docker-compose.yaml```
4. Запустить ```docker-compose up -d```

### 2. Пользователь
1. Получить API_HASH и API_ID
2. Получить api-key OpenAI
3. Добавить их в env ```docker-compose.yaml```
4. Запустить ```docker-compose up -d```
5. Зайти в контейнер и запустить ```tglogin.js```
6. Ввести код авторизации
7. Внутри контейнера выполнить ```pm2 restart all```

## Возможности 
Для получения помощи отправить ```/help```

Для установки поведения отправить ```/system поведение``` или во время отправки сообщения ```поведение/system/текст сообщения```. Например можно установить, чтобы он переводил текст: ```/system Ты помощник в переводе текста с русского на японский```

Для включения режима запоминания истории (режим "чата") ```/history```. В данном режиме бот будет запоминать все сообщения и отвечать учитывая предыдущие сообщения. Вызов команды отчищает сохраненную в базе историю сообщений.

Для принудительной отчистки истории ```/clear_history```
