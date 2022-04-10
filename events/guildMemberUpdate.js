const Discord = require('discord.js');

module.exports = async (client, oldMember, newMember) => {
  if (newMember.guild.id !== client.config.mainGuild) {
    return;
  }

  if (oldMember.nickname !== newMember.nickname) {
    const embed = new Discord.MessageEmbed()
      .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
      .setTimestamp()
      .setColor('#00e5ff')
      .setFooter({ text: `ID: ${newMember.id}` })
      .addField('**Nickname Update**', `**Before:**${oldMember.nickname ? oldMember.nickname.replace(/(\*|~|_|`|<|\|)/g, '\\$1') : oldMember.user.username.replace(/(\*|~|_|`|<|\|)/g, '\\$1')}
**+After:**${newMember.nickname ? newMember.nickname.replace(/(\*|~|_|`|<|\|)/g, '\\$1') : newMember.user.username.replace(/(\*|~|_|`|<|\|)/g, '\\$1')}`);

    client.userDB.ensure(newMember.id, newMember.joinedTimestamp, 'joinedTimestamp');
    client.userDB.ensure(newMember.id, client.config.userDBDefaults);
    client.userDB.push(newMember.id, { timestamp: Date.now(), nickname: newMember.nickname || newMember.user.username }, 'nicknames');

    oldMember.guild.channels.cache.get(client.config.actionLog).send({ embeds: [embed] });
  }
};
