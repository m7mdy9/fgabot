const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { ownerId, logstuff } = require("../index.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName(`test`)
    .setDescription(`test`),
    async execute(interaction){
        logstuff(interaction.guild.id)
        if (interraction.user.id != ownerId){
            return interaction.editReply(`Only <@!${ownerId}> can run this command.`)
        }
        interaction.editReply(`good job`)
    }
}
