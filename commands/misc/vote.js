const emojiRegex = require('emoji-regex/RGI_Emoji');

// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level) => {
  let msgToReact = message.channel.messages.cache.get(args[0]);

  // eslint-disable-next-line no-restricted-globals
  if (!msgToReact) {
    if (parseInt(args[0], 10)) {
      try {
        msgToReact = await message.channel.messages.fetch(args[0]);
      } catch (err) {
        client.error(message.channel, 'No Message Found!', 'No message was found! Please use a valid message id from **THIS** channel!');
        return;
      }
    } else {
      client.error(message.channel, 'Not a Message ID!', 'Please use this command with a valid message id from **THIS** channel!');
      return;
    }
  }

  switch (args[1]) {
    case undefined:
      await msgToReact.react(client.emoji.thumbsUp);
      await msgToReact.react(client.emoji.thumbsDown);
      await msgToReact.react(client.emoji.neutral);
      break;
    case 'nn':
    case 'noneutral':
      await msgToReact.react(client.emoji.thumbsUp);
      await msgToReact.react(client.emoji.thumbsDown);
      break;
    default: {
      const customEmojiRegex = /<a?:\w+:([\d]+)>/g;
      let regMatch;
      // eslint-disable-next-line no-cond-assign
      while ((regMatch = customEmojiRegex.exec(message.content)) !== null) {
        // eslint-disable-next-line no-await-in-loop
        await msgToReact.react(regMatch[1]);
      }

      const emojiregex = emojiRegex();
      let match;
      // eslint-disable-next-line no-cond-assign
      while ((match = emojiregex.exec(message.content)) !== null) {
        const emoji = match[0];
        // eslint-disable-next-line no-await-in-loop
        await msgToReact.react(emoji);
      }
    }
  }

  setTimeout(() => {
    message.delete();
  }, 1000);
};

module.exports.conf = {
  guildOnly: true,
  aliases: [],
  permLevel: 'Copper & Booker',
  args: 1,
};

module.exports.help = {
  name: 'vote',
  category: 'misc',
  description: 'Create a simple reaction vote with a provided message id',
  usage: 'vote <message id>',
  details: '<message id> => A valid message id from the channel the command is used in.',
};
