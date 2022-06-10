"use strict";

const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, Permissions, MessageEmbed } = require("discord.js");
const { MessageActionRow, MessageButton, Interaction } = require("discord.js");
const moment = require("moment")
const emojis = require("../../../emojis/emojis");
const config = require("../../../owners.json");

const userAuth = require("../../models/Auth/user")

module.exports.cooldown = {
  length: 604800000 /* in ms */,
  users: new Set(),
};

/**
 * Runs the command.
 * @param {CommandInteraction} interaction The Command Interaciton
 * @param {any} utils Additional util
 */
module.exports.run = async (interaction, utils) => {
  try {
    
    const masterLogger = interaction.client.channels.cache.get(config.channel);

    // Find the user in the database, if he isn't registered, return an error.
    const hasAccount = await userAuth.find({
      userID: interaction.user.id,
    });

    // If the user isnt registered/if there is no data, dont do anything.
    if (!hasAccount)
      return interaction.reply({
        content: `${emojis.error} | You first have to \`signup\` to be able to view your Account.`,
        ephemeral: true,
      });

    const enteredpassword = interaction.options.getString("password")

    const userpassword = await userAuth.find({
        password: enteredpassword
    });

    const userdataembed = new MessageEmbed()
    .setTitle(`${emojis.notify}`)
    .setDescription(`**AUTOMATED MESSAGE**\n\nThis is a verification that your Account has been deleted successfully.`)
    .setFooter({ text: `User: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})
    .setTimestamp()

    const verify = `${emojis.success}`;
    const cancel = `${emojis.error}`;

    const components = (state) => [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("verify")
          .setEmoji(verify)
          .setStyle("SUCCESS")
          .setLabel("Yes")
          .setDisabled(state),
        new MessageButton()
          .setCustomId("deny")
          .setEmoji(cancel)
          .setStyle("DANGER")
          .setLabel("No")
          .setDisabled(state)
      ),
    ];

    const initialEmbed = new MessageEmbed()
      .setTitle("DELETE ACCOUNT?")
      .setDescription(
        `Are you sure you want to \`delete\` your Account?\nYou won't be able to recover it.`
      )
      .addField(
        "\u200b",
        `
                Click ${verify} to continue.
                Click ${cancel} to cancel the request.
      `
      );
    const initialMessage = await interaction.reply({
      embeds: [initialEmbed],
      components: components(false),
      fetchReply: true,
    });

    // Only allow button interactions from the author of the interaction
    const filter = (i) => {
      if (i.user.id === interaction.user.id) return true;
      else i.reply({ content: "This is not for you!", ephemeral: true });
    };

    const collector = initialMessage.channel.createMessageComponentCollector({
      filter,
      time: 60000,
      max: 1,
    });

    collector.on("collect", async (interaction, user) => {
      interaction.deferUpdate();
      if (interaction.customId === "verify") {
        const editEmbed = new MessageEmbed()
          .setTitle("DELETED ACCOUNT")
          .setDescription(`${emojis.notify} successfully deleted Account.\nCheck your DMs!`)
          .setFooter({
            text: `Requested by: ${interaction.user.username}`,
            displayAvatarURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp()
          .setColor("RANDOM");

        initialMessage.edit({
          embeds: [editEmbed],
          components: components(true),
        });

        // Sends the User confirmation and deletes data
        interaction.user.send({ embeds: [userdataembed] })
        hasAccount.delete();

      } else if (interaction.customId === "deny") {
        const editEmbed = new MessageEmbed()
          .setTitle("CANCELLED")
          .setDescription(
            `Successfully \`cancelled\` your request.`
          )
          .setColor("RANDOM");

        initialMessage.edit({
          embeds: [editEmbed],
          components: components(true),
        });
      }

      const logs = new MessageEmbed()
        .setTitle(`${emojis.error} Deleted Account`)
        .setDescription(
          `
        **Actioned by**: \`${interaction.user.tag}\`
        **Date**: \`${moment((Date.now() * 1000) / 1000).fromNow()}\`
        `
        )
        .setColor("GREEN")
        .setTimestamp();
        
        /*
        if(masterLogger) {
            masterLogger.send({ embeds: [logs] })
        }
        */

    });
  
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports.permissions = {
  clientPermissions: [Permissions.FLAGS.SEND_MESSAGES],
  userPermissions: [Permissions.FLAGS.SEND_MESSAGES],
};

module.exports.data = new SlashCommandBuilder()
  .setName("signout")
  .setDescription("Deletes your Account/logs you out")
