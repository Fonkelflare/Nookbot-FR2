// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level) => {
  // Setting member to first member mentioned
  let member = message.mentions.members.first();
  if (!member) {
    if (parseInt(args[0], 10)) {
      try {
        member = await client.users.fetch(args[0]);
      } catch (err) {
        // Don't need to send a message here
      }
    }
  }

  // If no user mentioned, display this
  if (!member) {
    return client.error(message.channel, 'Invalid Member!', 'Please mention a valid member of this server!');
  }

  // Sets reason shown in audit logs
  const noDelete = !!(args[1] === 'nodelete' || args[1] === 'nd');
  const reason = args[noDelete ? 2 : 1] ? args.slice(noDelete ? 2 : 1).join(' ') : 'No reason provided.';

  try {
    const dmChannel = await member.createDM();
    await dmChannel.send(`You have been banned from the AC:NH server for the following reason:
**${reason}**
If you wish to appeal your ban, fill out this Google Form:
${client.config.banAppealLink}`);
  } catch (e) {
    client.error(message.guild.channels.cache.get(client.config.staffChat), 'Failed to Send DM to Member!', "I've failed to send a dm to the most recent member banned. They most likely had dms off.");
  }

  // Bans the member
  return message.guild.members.ban(member, { reason, days: noDelete ? 0 : 1 }).then((memberBanned) => {
    // If ban is successful, display this
    client.success(message.channel, 'Ban Successful!', `${message.author}, I've successfully banned **${memberBanned.guild ? memberBanned.user.tag : `${memberBanned.username}#${memberBanned.discriminator}` || memberBanned}**!`);
  }).catch((error) => client.error(message.channel, 'Ban Failed!', `${message.author}, I've failed to ban this member! ${error}`));
};

module.exports.conf = {
  guildOnly: true,
  aliases: [],
  permLevel: 'Head Mod',
  args: 1,
};

module.exports.help = {
  name: 'ban',
  category: 'moderation',
  description: 'Bans the mentioned member. Can be used with or without a stated reason.',
  usage: 'ban <@member> <reason>',
  details: '<@member> => Any valid member of the server that does not have a higher role and is not the owner.\n<reason> => The reason for the ban. Totally optional.',
};
