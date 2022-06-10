"use strict";

const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, Permissions, MessageEmbed, WebhookClient } = require("discord.js");

// Database queries
const Guild = require("../../models/Logging/logs");

// Configs
const emojis = require("../../../Controller/emojis/emojis");

module.exports.cooldown = {
    length: 10000, /* in ms */
    users: new Set()
};

/**
 * Runs the command.
 * @param {CommandInteraction} interaction The Command Interaciton
 * @param {any} utils Additional util
 */
module.exports.run = async (interaction, utils, guild, member) =>
{
    try
    {

        let channel = interaction.channel;

        channel.permissionOverwrites.create(channel.guild.roles.everyone, { SEND_MESSAGES: true, ADD_REACTIONS: true });

        await interaction.reply({ content: `${emojis.success} unlocked ${channel}`, ephemeral: false });

        const embed = new MessageEmbed()
        .setTitle(`${emojis.staff} Channel Update`)
        .setDescription(`Channel: ${channel}\nModerator: ${interaction.user.tag}\nAction: **Locked Channel**`)
        .setTimestamp()
        .setColor("GREEN")
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `From: ${interaction.guild.name}`, iconURL: String })
        
        const guildQuery = await Guild.findOne({ id: interaction.guild.id })
        if(!guildQuery) return;

        if(guildQuery) {
            const webhookid = guildQuery.webhookid;
            const webhooktoken = guildQuery.webhooktoken;

            const webhookClient = new WebhookClient({ id: webhookid, token: webhooktoken });
    
            webhookClient.send({ embeds: [embed]})
        } 
    }
    catch (err)
    {
        return Promise.reject(err);
    }
};

module.exports.permissions = {
    clientPermissions: [Permissions.FLAGS.MANAGE_CHANNELS],
    userPermissions: [Permissions.FLAGS.MANAGE_CHANNELS]
};

module.exports.data = new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlocks the channel. Now everyone can again write in this channel.");
