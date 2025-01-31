const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { logstuff } = require("../utils/utils.js")
const { getclient } = require("../index.js")
require('dotenv').config({ path: '../.env' })
const ownerId = process.env.ownerId
module.exports = {
    name: "test",
    description: "A test command",
    async execute(interaction){
        const client = interaction.client
        logstuff(client, interaction.guild.id)
        if (interaction.user.id != ownerId){
            return interaction.editReply(`Only <@!${ownerId}> can run this command.`)
        }
        interaction.editReply(`good job`)
    }
}
