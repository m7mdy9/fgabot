const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { logstuff } = require("../utils.js")
const { getownerid } = require("../index.js")
const ownerId = getownerid();
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
