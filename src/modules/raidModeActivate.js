const Discord = require('discord.js');

module.exports = (client) => {
  client.raidModeActivate = async (guild) => {
    // Enable Raid Mode
    client.raidMode = true;
    // Save @everyone role and staff/actionlog channels here for ease of use.
    const { everyone } = guild.roles;
    const staffChat = guild.channels.cache.get(client.config.staffChat);
    const joinLeaveLog = guild.channels.cache.get(client.config.joinLeaveLog);

    const generalChat = guild.channels.cache.get('538938170822230026');
    const acnhChat = guild.channels.cache.get('494376688877174785');
    const raidMsg = "**Raid Ongoing**!\nWe're sorry to inconvenience everyone, but we've restricted all message sending capabilities due to a suspected raid. Don't worry though, you'll be back to chatting about your favorite game in no time, yes yes!";
    const noMoreRaidMsg = "**Raid Mode Has Been Lifted**!\nWe've determined that it's safe to lift raid mode precautions and allow everyone to send messages again! Channels should open up again immediately, yes yes!";

    await generalChat.send(raidMsg);
    await acnhChat.send(raidMsg);

    // Create a Permissions object with the permissions of the @everyone role, but remove Send Messages.
    const perms = new Discord.Permissions(everyone.permissions).remove('SEND_MESSAGES');
    everyone.setPermissions(perms);

    // Send message to staff with prompts
    const banButton = new Discord.MessageButton()
      .setCustomId('ban')
      .setLabel('Ban Members')
      .setStyle('SUCCESS');
    const cancelButton = new Discord.MessageButton()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle('DANGER');
    client.raidMessage = await staffChat.send({
      content: `**##### RAID MODE ACTIVATED #####**
<@&495865346591293443> <@&494448231036747777>

A list of members that joined in the raid is being updated in <#689260556460359762>.
This message updates every 5 seconds, and you should wait to decide until the count stops increasing.

If you would like to remove any of the members from the list, use the \`.raidremove <ID>\` command.

Would you like to ban all ${client.raidJoins.length} members that joined in the raid?`,
      components: [new Discord.MessageActionRow()
        .addComponents(
          banButton,
          cancelButton,
        )],
    });
    // Listen for interactions and log which action was taken and who made the decision.
    const filter = (interaction) => ['ban', 'cancel'].includes(interaction.customId)
            && interaction.memberPermissions.has('BAN_MEMBERS') && !interaction.user.bot;
    client.raidMessage.awaitMessageComponent({ filter, componentType: 'BUTTON' })
      .then(async (interaction) => {
        if (interaction.customId === 'ban') {
          // A valid user has selected to ban the raid party.
          banButton.setDisabled();
          cancelButton.setStyle('SECONDARY').setDisabled();
          interaction.update({
            components: [new Discord.MessageActionRow()
              .addComponents(
                banButton,
                cancelButton,
              ),
            ],
          });
          // Log that the banning is beginning and who approved of the action.
          client.success(staffChat, 'Banning!', `User ${interaction.user.tag} has chosen to ban the raid. It may take some time to finish banning all raid members.`);
          client.raidBanning = true;
          client.raidBans = [];
          // Create a setInterval to ban members without rate limiting.
          const interval = setInterval(() => {
            if (client.raidJoins.length !== 0) {
              // Ban the next member save the memberId to new list of bans so we don't create ban/leave logs for them.
              client.raidBans.push(client.raidJoins[0].id);
              client.raidJoins.shift().ban({ days: 1, reason: 'Member of raid.' })
                .catch(console.error);
            } else {
              // We've finished banning, annouce that raid mode is ending.
              staffChat.send('Finished banning all raid members. Raid Mode is deactivated.');
              joinLeaveLog.send(`The above ${client.raidMembersPrinted} members have been banned.`);
              // Reset all raid variables
              client.raidMode = false;
              // Deactivate Raid Banning after a few seconds to allow for other events generated to finish
              setTimeout(() => {
                client.raidBanning = false;
              }, 15000);
              client.raidJoins = [];
              client.raidMessage = null;
              client.raidMembersPrinted = 0;

              generalChat.send(noMoreRaidMsg);
              acnhChat.send(noMoreRaidMsg);
              // Allow users to send messages again.
              perms.add('SEND_MESSAGES');
              everyone.setPermissions(perms);
              clearInterval(interval);
            }
          }, 100); // 100 ms is 10 bans a second, hopefully not too many.
        } else {
          // A valid user has selected not to ban the raid party.
          cancelButton.setDisabled();
          banButton.setStyle('SECONDARY').setDisabled();
          interaction.update({
            components: [new Discord.MessageActionRow()
              .addComponents(
                banButton,
                cancelButton,
              ),
            ],
          });
          client.error(staffChat, 'Not Banning!', `User ${interaction.user.tag} has chosen to not ban the raid. Raid Mode is deactivated.`);
          // Reset all raid variables
          client.raidMode = false;
          client.raidJoins = [];
          client.raidMessage = null;
          client.raidMembersPrinted = 0;
          // Allow users to send messages again.
          generalChat.send(noMoreRaidMsg);
          acnhChat.send(noMoreRaidMsg);

          perms.add('SEND_MESSAGES');
          everyone.setPermissions(perms);
        }
      })
      .catch(console.error);
    // If there are new joins, regularly log them to nook-log and update the message with the count
    let msg = '**##### RAID MODE ACTIVATED #####**\nBELOW IS A LIST OF ALL MEMBERS THAT JOINED IN THE RAID';
    const updateRaid = setInterval(() => {
      // If the raid is over, don't update anymore.
      if (!client.raidMode) {
        clearInterval(updateRaid);
      } else if (!client.raidBanning) {
        client.raidMessage.edit(`**##### RAID MODE ACTIVATED #####**
<@&495865346591293443> <@&494448231036747777>

A list of members that joined in the raid is being updated in <#689260556460359762>.
This message updates every 5 seconds, and you should wait to decide until the count stops increasing.

If you would like to remove any of the members from the list, use the \`.raidremove <ID>\` command.

Would you like to ban all ${client.raidJoins.length} members that joined in the raid?`);
        // Grab all the new raid members since last update.
        if (client.raidMembersPrinted !== client.raidJoins.length) {
          const newMembers = client.raidJoins.slice(client.raidMembersPrinted);
          client.raidMembersPrinted += newMembers.length;
          newMembers.forEach((mem) => {
            msg += `\n${mem.user.tag} (${mem.id})`;
          });
          client.sendLongMessage(joinLeaveLog, msg);
          msg = '';
        }
      }
    }, 5000);
  };
};
