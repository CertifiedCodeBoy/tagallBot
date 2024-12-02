import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Persistent storage for group members
const groupMembers = new Map();
const black = 'Totlimos the goat';

// Configure environment variables
dotenv.config();

// Create bot instance outside handler
const bot = new TelegramBot(process.env.TOKEN);

export default async function handler(req, res) {
  // Verify this is a POST request from Telegra
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const update = req.body;
    const msg = update.message;

    if (!msg || (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup')) {
      return res.status(200).send('OK');
    }

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name ? msg.from.last_name : '';
    const fullName = `${firstName} ${lastName}`.trim();

    // Ensure chat-specific members map exists
    if (!groupMembers.has(chatId)) {
      groupMembers.set(chatId, new Set());
    }
    const currentChatMembers = groupMembers.get(chatId);

    // Block specific user
    if (firstName === black || msg.from.first_name === 'Totlimos' || fullName === black) {
      await bot.sendMessage(chatId, 'bl3 ka7louch');
    }

    // Handle new chat members
    if (msg.new_chat_members) {
      msg.new_chat_members.forEach((member) => {
        bot.sendMessage(chatId, `${member.first_name} Have joined the Chat !`);
        currentChatMembers.add(member.id);
      });
    }

    // Handle members leaving
    if (msg.left_chat_member) {
      bot.sendMessage(chatId, `${msg.left_chat_member.first_name} Have left the Chat !`);
      currentChatMembers.delete(msg.left_chat_member.id);
    }

    // Command handlers
    if (msg.text) {
      const text = msg.text;

      if (text === '/join') {
        currentChatMembers.add(userId);
        await bot.sendMessage(chatId, 'You have joined the group!');
      }

      if (text === '/leave') {
        currentChatMembers.delete(userId);
        await bot.sendMessage(chatId, 'You have left the group!');
      }

      if (text === '/ls') {
        await bot.sendMessage(chatId, 'sahaaa jellol');
      }

      if (text === '/showmembers') {
        try {
          const membersList = [];
          for (const memberId of currentChatMembers) {
            try {
              const member = await bot.getChatMember(chatId, memberId);
              const user = member.user;
              membersList.push(user.username
                ? `${user.username}`
                : `${user.first_name} ${user.last_name || ''}`);
            } catch (error) {
              console.error(`Failed to get member info for user ID ${memberId}: ${error.message}`);
            }
          }

          const membersMessage = membersList.length > 0
            ? membersList.join('\n')
            : 'No members found.';

          await bot.sendMessage(chatId, membersMessage);
        } catch (error) {
          console.error(error.message);
        }
      }

      if (text === '/mentionall') {
        try {
          // Convert Set to Array to ensure consistency
          const memberArray = Array.from(currentChatMembers);
          
          // Limit mentions to prevent spam
          if (memberArray.length > 50) {
            await bot.sendMessage(chatId, 'Too many members to mention!');
            return;
          }

          const mentions = [];
          for (const memberId of memberArray) {
            try {
              // Use safe error handling
              const member = await bot.getChatMember(chatId, memberId).catch(() => null);
              
              if (!member || !member.user) continue;
              
              const user = member.user;
              mentions.push(user.username
                ? `@${user.username}`
                : `[${user.first_name}](tg://user?id=${user.id})`);
            } catch (error) {
              console.error(`Mention error for user ${memberId}:`, error);
            }
          }

          // Ensure mentions are not empty
          if (mentions.length === 0) {
            await bot.sendMessage(chatId, 'No members could be mentioned.');
            return;
          }

          // Split mentions if too long
          if (mentions.join(' ').length > 4096) {
            const chunks = [];
            let currentChunk = [];
            let currentLength = 0;

            for (const mention of mentions) {
              if (currentLength + mention.length > 4096) {
                chunks.push(currentChunk.join(' '));
                currentChunk = [];
                currentLength = 0;
              }
              currentChunk.push(mention);
              currentLength += mention.length;
            }

            if (currentChunk.length > 0) {
              chunks.push(currentChunk.join(' '));
            }

            for (const chunk of chunks) {
              await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
            }
          } else {
            await bot.sendMessage(chatId, mentions.join(' '), { parse_mode: 'Markdown' });
          }
        } catch (error) {
          console.error('Mentioning all error:', error);
          await bot.sendMessage(chatId, 'Failed to mention all members.');
        }
      }

      if (text === '/start') {
        await bot.sendMessage(chatId, "Hello! Use /join to join a group.");
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Error');
  }
}
