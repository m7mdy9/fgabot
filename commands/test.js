const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { logstuff } = require("../utils.js")
const { getclient } = require("../index.js")
require('dotenv').config({ path: '../.env' })
const ownerId = process.env.ownerId
const client = getclient;
module.exports = {
    data: new SlashCommandBuilder()
    .setName(`test`)
    .setDescription(`test`),
    async execute(interaction){
        logstuff(client, interaction.guild.id)
        if (interaction.user.id != ownerId){
            return interaction.editReply(`Only <@!${ownerId}> can run this command.`)
        }
        interaction.editReply(`good job`)
    }
}
