import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { ownerId, logstuff } from "../index.js"

export const data = new SlashCommandBuilder()
    .setName(`test`)
    .setDescription(`test`)
export async function execute(interaction) {
    logstuff(interaction.guild.id)
    if (interraction.user.id != ownerId) {
        return interaction.editReply(`Only <@!${ownerId}> can run this command.`)
    }
    interaction.editReply(`good job`)
}
