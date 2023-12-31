const { version } = require('discord.js');

module.exports.run = async (client, message, args, level, Discord) => {
  const owner = await client.fetchOwner();

  // embed
  const embed = new Discord.MessageEmbed()
    .setColor('#4199c2')
    .setTimestamp();

  switch (args[0]) {
    case 'bot': {
      if (level < 8) {
        return client.error(message.channel, 'Not Allowed!', 'You are not allowed to show bot information!');
      }

      const uptime = client.humanTimeBetween(client.uptime, 0);

      embed.setTitle('Bot Information')
        .setThumbnail(client.user.displayAvatarURL())
        .addField('Bot Name', client.user.username, true)
        .addField('Bot ID', client.user.id, true)
        .addField('Bot Owner', owner.tag, true)
        .addField('Bot Version', client.version, true)
        .addField('Online Users', `${client.users.cache.size}`, true)
        .addField('Server Count', `${client.guilds.cache.size}`, true)
        .addField('Discord.js Version', `v${version}`, true)
        .addField('Mem Usage', `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
        .addField('Node.js Version', `${process.version}`, true)
        .addField('Created On', `<t:${Math.floor(client.user.createdTimestamp / 1000)}>`, true)
        .addField('Uptime', uptime, true);

      return message.channel.send({ embeds: [embed] });
    }
    case 'user': {
      // Setting the member to the mentioned user
      let member = message.mentions.members.first() || client.guilds.cache.get(client.config.mainGuild).members.cache.get(args[0]);

      if (!member && !args[1]) {
        member = message.member;
      }

      if (!member) {
        try {
          member = await client.guilds.cache.get(client.config.mainGuild).members.fetch(args[1]);
        } catch (e) {
          return client.error(message.channel, 'Member Not Found!', 'This member may have left the server or the id provided is not a member id!');
        }
      }

      let activity = member.presence?.status || 'offline';

      if (activity === 'online') {
        activity = `${client.emoji.online} Online`;
      } else if (activity === 'idle') {
        activity = `${client.emoji.idle} Idle`;
      } else if (activity === 'dnd') {
        activity = `${client.emoji.dnd} Do Not Disturb`;
      } else if (activity === 'offline') {
        activity = `${client.emoji.offline} Offline/Invisible`;
      }

      embed.setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `ID: ${member.id}` })
        .setTitle(`${member.displayName}\'s Info`)
        .addField('Nickname', member.displayName, true)
        .addField('Status', activity, true)
        .addField('Account Created', `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>; <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
        .addField(`Joined *${client.guilds.cache.get(client.config.mainGuild).name}*`, `<t:${Math.floor(member.joinedAt / 1000)}:F>; <t:${Math.floor(member.joinedAt / 1000)}:R>`)
        .addField(`Roles (${member.roles.cache.size - 1})`, member.roles.cache.filter((r) => r.id !== member.guild.id).sort((a, b) => b.position - a.position).map((r) => r.toString()).join(', ') || 'No Roles');

      return message.channel.send({ embeds: [embed] });
    }
    case 'server':
      embed.setTitle('Server Information')
        .setTimestamp()
        .setThumbnail(message.guild.iconURL({ format: 'gif', dynamic: true }))
        .addField('Server Name', message.guild.name, true)
        .addField('Server ID', message.guild.id, true)
        .addField('Server Owner', `${(await message.guild.fetchOwner()).user.tag} (${message.guild.ownerId})`, true)
        .addField('Created On', `<t:${Math.floor(message.guild.createdTimestamp / 1000)}>`, true)
        .addField('Member Count', `${message.guild.memberCount}`, true);

      return message.channel.send({ embeds: [embed] });
    default:
      return client.error(message.channel, 'Invalid Subcommand!', `Remember to use subcommands when using this command! For example: \`bot\`, \`server\`, or \`user\`! For further details, use \`${client.config.prefix}help info\`!`);
  }
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['i'],
  permLevel: 'User',
  args: 1,
};

module.exports.help = {
  name: 'info',
  category: 'info',
  description: 'Provides info of the specified source',
  usage: 'info <bot|user|server>',
  details: '<bot|user|server> => The source of info.',
};
