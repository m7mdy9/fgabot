const { retry, getUserRankIndex, noblox, logerror } = require("../utils/utils.js");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
require('dotenv').config({ path: '../.env' });
const groupId = process.env.groupID;
const ownerId = process.env.ownerId;

let rankData = [];
let rankChoices = [];

module.exports = {
    name: "rank", // Command name
    description: "Promote or demote a user in the Roblox group.", // Command description
    options: [], // Placeholder for options (will be populated in setup)
    setup: async function () {
        try {
            rankData = await noblox.getRoles(groupId);
            const rankData1 = rankData.slice(1, 11); // Adjust slice as needed
            const rankChoices = rankData1.map(rank => ({ name: rank.name, value: rank.name }));

            // Dynamically populate the options
            this.options = [
                {
                    name: "username",
                    description: "The Roblox username of the member.",
                    type: 3, // STRING type
                    required: true
                },
                {
                    name: "rank",
                    description: "Select the rank.",
                    type: 3, // STRING type
                    required: true,
                    choices: rankChoices // Add rank choices
                }
            ];
        } catch (error) {
            console.error("Error setting up rank command:", error);
        }
    },
    async execute(interaction) {
        const client = interaction.client;
        const username = interaction.options.getString('username');
        const rankName = interaction.options.getString('rank');

        try {
            let userId, executorId;

            try {
                executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
            } catch (error) {
                await interaction.editReply('❌ Your current server nickname does not match any Roblox user.');
                return logerror(client, 'Error with non-matching username:', error);
            }

            const executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
            if (executorRankIndex < rankData.find(rank => rank.name === '[Instructor]').rank && interaction.user.id != ownerId) {
                return interaction.editReply('❌ You do not have permission to use this command.');
            }

            try {
                userId = await retry(async () => await noblox.getIdFromUsername(username));
            } catch (error) {
                logerror(client, 'Error with non-matching user to be ranked:', error);
                return interaction.editReply(`❌ The username "${username}" was not found on Roblox.`);
            }

            const targetRankIndex = await retry(async () => await getUserRankIndex(userId));
            const Action = targetRankIndex < rankData.find(rank => rank.name === rankName).rank;
            let RankType = "";

            if (targetRankIndex <= 0) {
                return interaction.editReply(`❌ **${username}** was not found in the group.`);
            }

            if (targetRankIndex >= executorRankIndex && interaction.user.id != ownerId) {
                return interaction.editReply('❌ You cannot promote or demote someone with a rank equal to or higher than yours.');
            }

            if (rankName === '[Federal Deputy Commander]' || rankData.find(r => r.name === rankName).rank >= rankData.find(r => r.name === '[Federal Deputy Commander]').rank) {
                return interaction.editReply('❌ The bot cannot perform rank changes for or above **[Federal Deputy Commander]**.');
            }

            if (targetRankIndex === rankData.find(r => r.name === rankName).rank) {
                return interaction.editReply(`❌ **${username}** is already at **${rankName}**`);
            }

            if (targetRankIndex >= rankData.find(r => r.name === '[Federal Deputy Commander]').rank) {
                return interaction.editReply('❌ The bot cannot perform rank changes for those ranked **[Federal Deputy Commander]** or above.');
            }

            if (Action) {
                RankType = "promoted";
            } else {
                RankType = "demoted";
            }

            const oldRank = rankData.find(rank => rank.rank === targetRankIndex).name;
            await retry(async () => {
                await noblox.setRank(groupId, userId, rankName);
            });

            const embed = new EmbedBuilder()
                .setTitle('Rank Change Successful')
                .setDescription(`**${username}** has been successfully ${RankType} to **${rankName}**.`)
                .setColor(Action ? '#00d907' : '#ad0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            const logChannel = await client.channels.fetch(process.env.CHANNELID);
            await logChannel.send(`\`The last rank change was made by ${interaction.member.displayName} to ${username} using the rank command.\``);
        } catch (error) {
            logerror(client, 'Error in rank change:', error);
            console.error('Error handling rank change:', error);
            await interaction.editReply('❌ An error occurred while processing this command.');
        }
    }
};