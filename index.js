/* eslint-disable consistent-return */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const Discord = require('discord.js');
const Enmap = require('enmap');
const fs = require('fs');
const Twitter = require('twitter-lite');
const { Searcher } = require('fast-fuzzy');

const config = require('./config');
const { version } = require('./package.json');
const emoji = require('./src/emoji');

const client = new Discord.Client({
  makeCache: Discord.Options.cacheWithLimits({
    MessageManager: 500,
  }),
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true,
  },
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_BANS,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
  partials: [
    'MESSAGE',
  ],
});

client.config = config;
client.version = `v${version}`;
client.emoji = emoji;

fs.readdir('./src/modules/', (err, files) => {
  if (err) {
    return console.error(err);
  }

  files.forEach((file) => {
    require(`./src/modules/${file}`)(client);
  });
});

fs.readdir('./events/', (err, files) => {
  if (err) {
    return console.error(err);
  }

  return files.forEach((file) => {
    const event = require(`./events/${file}`);
    client.on(file.split('.')[0], event.bind(null, client));
  });
});

client.commands = new Enmap();
client.aliases = new Enmap();

fs.readdir('./commands/', (err, folders) => {
  if (err) {
    return console.error(err);
  }

  // Looping over all folders to load all commands
  folders.forEach((folder) => {
    fs.readdir(`./commands/${folder}/`, (error, files) => {
      if (error) {
        return console.error(error);
      }

      files.forEach((file) => {
        if (!file.endsWith('.js')) {
          return;
        }

        const props = require(`./commands/${folder}/${file}`);
        const commandName = file.split('.')[0];

        console.log(`Attempting to load command: ${commandName}`);
        client.commands.set(commandName, props);

        if (props.conf.aliases) {
          props.conf.aliases.forEach((alias) => {
            client.aliases.set(alias, commandName);
          });
        }

        client.enabledCmds.ensure(commandName, true);
      });
    });
  });
});

client.levelCache = {};
for (let i = 0; i < config.permLevels.length; i++) {
  const thislvl = config.permLevels[i];
  client.levelCache[thislvl.name] = thislvl.level;
}

client.firstReady = false;

client.invites = {};

// Raid Mode
client.raidMode = false;
client.raidBanning = false;
client.raidBans = [];
client.raidJoins = [];
client.raidMessage = null;
client.raidMembersPrinted = 0;

// Auto-Filter Message Reminder Counts
client.imageOnlyFilterCount = 0;
client.imageAndTextOnlyFilterCount = 0;
client.newlineLimitFilterCount = 0;
client.imageAndLinkFilterCount = 0;
client.noMentionFilterCount = 0;
client.linkFilterCount = 0;

// Twitter object for listening for tweets
client.twitter = new Twitter({
  consumer_key: client.config.twitterAPIKey,
  consumer_secret: client.config.twitterAPISecret,
  access_token_key: client.config.twitterAccessToken,
  access_token_secret: client.config.twitterAccessTokenSecret,
});

// Start up the twitter webhook listener
client.twitterHook = new Discord.WebhookClient({ id: client.config.twitterHookID, token: client.config.twitterHookToken });

Object.assign(client, Enmap.multi(['enabledCmds', 'emojiDB', 'tags', 'sessionDB', 'muteDB', 'reactionRoleDB', 'bannedWordsDB', 'reactionSignUp', 'remindDB', 'timers', 'mmSignUp', 'attachmentDB', 'linkWhitelist'], { ensureProps: true }));
Object.assign(client, Enmap.multi(['userDB', 'infractionDB', 'headStaffNotesDB'], { fetchAll: false, ensureProps: true }));

// Banned words array and Searcher
const bannedWordsArray = client.bannedWordsDB.array();
client.bannedWordsFilter = new Searcher(bannedWordsArray, {
  keySelector: (s) => s.word, threshold: 1, returnMatchData: true, useSellers: false, ignoreSymbols: false,
});

client.login(config.token).then(() => {
  console.log('Bot successfully logged in.');
}).catch(() => {
  console.log('Retrying client.login()...');
  let counter = 1;
  const interval = setInterval(() => {
    console.log(`  Retrying attempt ${counter}`);
    counter += 1;
    client.login(config.token).then(() => {
      console.log('  Bot successfully logged in.');
      clearInterval(interval);
    });
  }, 30000);
});
