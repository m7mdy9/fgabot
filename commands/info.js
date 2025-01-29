import { parseDuration, makedurationbigger, client, ownerId, logerror } from "../index.js";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
    .setName(`info`)
    .setDescription(`Information`);
export async function execute(interaction) {
    try {
        let result = Math.round(interaction.client.uptime / 60000);
        let time = "minutes";
        if (result >= 60) {
            let result1 = result / 60;
            result = result1.toFixed(1);
            if (result >= 24) {
                result1 = result / 24;
                result = result1.toFixed(1);
                time = "days";
            } else {
                time = "hours";
            }
        }
        const embed1 = new EmbedBuilder()
            .setTitle("Information")
            .setDescription(`
                            The bot was developed and made by <@!${ownerId}> 
                            \n\nCurrent Ping for the bot is: **${client.ws.ping}ms** (Can be inaccurate) \n\n
                            Uptime: **${result} ${time}**
                            `)
            .setColor("DarkBlue");
        await interaction.editReply({ embeds: [embed1] });
    } catch (error) {
        logerror(`Error in info: `, error);
    }
}