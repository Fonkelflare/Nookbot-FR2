const { Searcher } = require('fast-fuzzy');

module.exports.run = (client, message, args, level) => { // eslint-disable-line no-unused-vars
  let argsMod = args.slice(1).join(' ');
  let word;
  let phrase = [];

  if (argsMod.includes('“') || argsMod.includes('”')) {
    argsMod = argsMod.replace(/[“”]/gi, '"');
  }

  if (/"([^"]+)"/.test(argsMod)) {
    phrase = argsMod.match(/"([^"]+)"/)[0].replace(/"/g, '').trim().toLowerCase().split(/\s+/);
    word = phrase.shift();
  } else {
    word = argsMod.split(' ').shift().toLowerCase();
  }

  if (!word) {
    client.error(message.channel, 'No Word or Phrase!', "You didn't supply a word or phrase!");
    return;
  }

  switch (args[0]) {
    case 'check':
    case 'chk':
    case 'c': {
      if (client.bannedWordsDB.find((s) => s.word === word && (s.phrase.length === 0 ? true : s.phrase.join(' ') === phrase.join(' ')))) {
        client.success(message.channel, 'Word in Database!', `The ${phrase.length === 0 ? `word \`${word}\`` : `phrase \`${word} ${phrase.join(' ')}\``} is already in the banned words database!`);
        break;
      }
      client.error(message.channel, 'Not in Database!', `The ${phrase.length === 0 ? `word \`${word}\`` : `phrase \`${word} ${phrase.join(' ')}\``} does not exist in the banned words database!`);
      break;
    }
    case 'add':
    case 'a': {
      if (level < 6) {
        client.error(message.channel, 'Not Allowed!', 'You are not allowed to add banned words!');
        break;
      }

      let autoBan = false;
      let global = true;
      const blockedChannels = [];

      if (/"([^"]+)"/.test(argsMod)) {
        autoBan = argsMod.replace(/^[^"]*"[^"]*"/, '').toLowerCase().trim().startsWith('ban');
      } else {
        autoBan = argsMod.split(' ').slice(1).join(' ').toLowerCase()
          .trim()
          .startsWith('ban');
      }

      if (message.mentions.channels.size > 0) {
        message.mentions.channels.forEach((ch) => blockedChannels.push(ch.id));
        global = false;
      }

      if (client.bannedWordsDB.find((s) => s.word === word && (s.phrase.length === 0 ? true : s.phrase.join(' ') === phrase.join(' ')))) {
        client.error(message.channel, 'Already in Database!', `The ${phrase.length === 0 ? `word \`${word}\`` : `phrase \`${word} ${phrase.join(' ')}\``} is already in the banned words database! Please remove it if you wish to change an option.`);
        break;
      }

      client.bannedWordsFilter.add({
        word, phrase, autoBan, global, blockedChannels,
      });

      client.bannedWordsDB.set(client.bannedWordsDB.autonum, {
        word, phrase, autoBan, global, blockedChannels,
      });

      client.success(message.channel, 'Successfully Added to Banned Words!', `I've successfully added \`${phrase.length === 0 ? `${word}` : `${word} ${phrase.join(' ')}`}\` to the banned words database!`);
      break;
    }
    case 'remove':
    case 'rem':
    case 'r':
    case 'delete':
    case 'del':
    case 'd': {
      if (level < 6) {
        client.error(message.channel, 'Not Allowed!', 'You are not allowed to remove banned words!');
        break;
      }

      const key = client.bannedWordsDB.findKey((s) => s.word === word && (s.phrase.length === 0 ? true : s.phrase.join(' ') === phrase.join(' ')));

      if (!key) {
        client.error(message.channel, 'Not in Database!', `The ${phrase.length === 0 ? `word \`${word}\`` : `phrase \`${word} ${phrase.join(' ')}\``} does not exist in the banned words database and therefore cannot be removed!`);
        break;
      }

      const bannedWordsArray = client.bannedWordsDB.delete(key).array();
      client.bannedWordsFilter = new Searcher(bannedWordsArray, {
        keySelector: (s) => s.word, threshold: 1, returnMatchData: true, useSellers: false, ignoreSymbols: false,
      });

      client.success(message.channel, 'Successfully Removed From Banned Words!', `I've successfully removed \`${phrase.length === 0 ? `${word}` : `${word} ${phrase.join(' ')}`}\` from the banned words database!`);
      break;
    }
    default:
      client.error(message.channel, 'Invalid Usage!', "You need to specify if you're checking, adding, or removing a word! Usage: \`.word <check|add|remove> <word|\"multiple words\"> <ban> <#channels>\`");
  }
};

module.exports.conf = {
  guildOnly: true,
  aliases: [],
  permLevel: 'Mod',
  args: 2,
};

module.exports.help = {
  name: 'word',
  category: 'moderation',
  description: 'Adds or removes words and phrases from the banned words database',
  usage: 'word <check|add|remove> <word|"multiple words"> <ban> <#channels>',
  details: '<check|add|remove> => Whether to check, add, or remove words or phrases from the database.\n<word|"multiple words"> => The word or phrase to add to the database. NOTE: Use quotes (") when adding phrases.\n<ban> => Whether to ban the member automatically for using this word or phrase.\n<#channels> => The channels for which this word or phrase is banned. NOTE: Only needed if the word or phrase is not global.',
};
