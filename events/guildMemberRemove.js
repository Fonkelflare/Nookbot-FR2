const Discord = require('discord.js');

module.exports = async (client, member) => {
  if (member.guild.id !== client.config.mainGuild || client.raidBanning || client.raidBans.includes(member.id)) {
    return;
  }

  client.userDB.ensure(member.id, client.config.userDBDefaults);

  member.roles.cache.forEach((r) => {
    client.userDB.push(member.id, r.id, 'roles');
  });

  const serverAge = client.humanTimeBetween(Date.now(), member.joinedTimestamp || client.userDB.get(member.id, 'joinedTimestamp') || Date.now());

  const rolesArray = member.roles.cache.filter((r) => r.id !== member.guild.id);
  const roles = rolesArray.map((r) => `<@&${r.id}>`).join(', ') || 'No Roles';

  // Role persistence
  rolesArray.forEach((r) => {
    // Check if it's managed, since we can't add those roles back with the bot later
    if (!r.managed) {
      client.userDB.push(member.id, r.id, 'roles');
    }
  });

  const embed = new Discord.MessageEmbed()
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
    .setColor('#ff07a9')
    .setTimestamp()
    .setFooter({ text: `ID: ${member.id}` })
    .setThumbnail(member.user.displayAvatarURL())
    .addField('**Member Left**', `<@${member.id}>`, true)
    .addField('**Member For**', serverAge, true)
    .addField(`**Roles (${rolesArray.size})**`, roles, true);

  member.guild.channels.cache.get(client.config.joinLeaveLog).send({ embeds: [embed] });
};
