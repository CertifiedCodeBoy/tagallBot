require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

let groupMembers = new Set();

const black = 'Totlimos the goat';

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
        return; 
    }

    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name ? msg.from.last_name : '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (firstName === black || msg.from.first_name === 'Totlimos' || fullName === black) {
        bot.sendMessage(chatId, 'bl3 ka7louch');
    }

    if (msg.new_chat_members) {
        msg.new_chat_members.forEach((member) => {
            bot.sendMessage(chatId, `${member.first_name} Have joined the Chat !`);
            groupMembers.add(member.id);
        });
    }

    if (msg.left_chat_member) {
        bot.sendMessage(chatId, `${msg.left_chat_member.first_name} Have left the Chat !`);
        groupMembers.delete(msg.left_chat_member.id);
    }
});

bot.onText(/\/join/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    groupMembers.add(userId);
    bot.sendMessage(chatId, 'You have joined the group!');
});

bot.onText(/\/leave/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    groupMembers.delete(userId);
    bot.sendMessage(chatId, 'You have left the group!');
});

bot.onText(/\/ls/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    bot.sendMessage(chatId, 'sahaaa jellol');
});

bot.onText(/\/showmembers/, async (msg) => {
    const chatId = msg.chat.id;

    if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
        return;
    }

    try {
        const membersList = [];
        for (const userId of groupMembers) {
            try {
                const member = await bot.getChatMember(chatId, userId);
                const user = member.user;
                membersList.push(user.username
                    ? `${user.username}`
                    : `${user.first_name} ${user.last_name || ''}`);
            } catch (error) {
                console.error(`Failed to get member info for user ID ${userId}: ${error.message}`);
            }
        }

        const membersMessage = membersList.length > 0
            ? membersList.join('\n')
            : 'No members found.';

        await bot.sendMessage(chatId, membersMessage);
    } catch (error) {
        console.error(error.message);
    }
});

bot.onText(/\/mentionall/, async (msg) => {
    const chatId = msg.chat.id;

    if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
        bot.sendMessage(chatId, 'This command can only be used in group chats.');
        return;
    }

    try {
        const mentions = [];
        for (const userId of groupMembers) {
            try {
                const member = await bot.getChatMember(chatId, userId);
                const user = member.user;
                mentions.push(user.username
                    ? `@${user.username}`
                    : `[${user.first_name}](tg://user?id=${user.id})`);
            } catch (error) {
                console.error(`Failed to get member info for user ID ${userId}: ${error.message}`);
            }
        }

        await bot.sendMessage(chatId, mentions.join(' '), { parse_mode: 'Markdown' });
    } catch (error) {
        console.error(error.message);
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hello! Use /mentionall to tag everyone.");
});