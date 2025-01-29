const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { logstuff } = require("../utils.js")
const { getownerid, getclient } = require("../index.js")
module.exports = {
    data: new SlashCommandBuilder()
    .setName(`test`)
    .setDescription(`test`),
    async execute(interaction){
        const ownerId = getownerid || "";
        const client = getclient || "";
        logstuff(client, interaction.guild.id)
        if (interaction.user.id != ownerId){
            return interaction.editReply(`Only <@!${ownerId}> can run this command.`)
        }
        interaction.editReply(`good job`)
    }
}
