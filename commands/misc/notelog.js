// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, level) => {
  let user;
  if (parseInt(args[0], 10)) {
    try {
      user = await client.users.fetch(args[0]);
    } catch (err) {
      client.error(message.channel, 'Invalid Member!', 'Please mention a valid member of this server!');
      return;
    }
  }

  const { headStaffNotes } = client.userDB.ensure(user.id, client.config.userDBDefaults);

  if (headStaffNotes.length === 0) {
    client.error(message.channel, 'No Notes Found!', `I did not find any notes recorded for **${user.tag}**!`);
    return;
  }

  let msg = `__**•• Head Staff Notes for ${user.tag} ••**__`;

  headStaffNotes.sort((a, b) => {
    if (a.type === 'note') {
      if (b.type === 'note') {
        return 0;
      }
      return -1;
    }

    if (a.type === 'warning') {
      if (b.type === 'warning') {
        return 0;
      }
      if (b.type === 'absence') {
        return -1;
      }
      return 1;
    }

    if (a.type === b.type) {
      return 0;
    }

    return 1;
  });

  // eslint-disable-next-line array-callback-return
  headStaffNotes.forEach((n, i, arr) => {
    if (arr[i - 1]) {
      if (n.type !== arr[i - 1].type) {
        if (n.type === 'absence') {
          msg += '\n\n**Absences**';
        } else {
          msg += '\n\n**Warnings**';
        }
      }
    } else {
      msg += '\n**General Notes**';
    }

    const headStaffMember = client.users.cache.get(n.headStaffMember);
    msg += `\n• Case ${n.case} - ${headStaffMember ? `HM+: ${headStaffMember.tag}` : `Unknown HM+ ID: ${n.headStaffMember || 'No ID Stored'}`} - (<t:${Math.floor(new Date(n.date).getTime() / 1000)}>)\n> Reason: ${n.reason}`;
  });

  client.sendLongMessage(message.channel, msg);
};

module.exports.conf = {
  guildOnly: true,
  aliases: ['notes', 'noteslog', 'nl'],
  args: 1,
  permLevel: 'Head Mod',
};

module.exports.help = {
  name: 'notelog',
  category: 'misc',
  description: 'View head staff notes on a user.',
  usage: 'notelog <id>',
  details: '<id> => The id of the member to view notes of.',
};
