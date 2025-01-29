const { parseDuration, 
    makedurationbigger, client,  
    ownerId, logerror, groupId, getUserRankIndex, 
    retry, noblox} = require("../index.js");
const { SlashCommandBuilder, EmbedBuilder} = require("discord.js")
let rankData = [];
    retry(async () => {
        rankData = await noblox.getRoles(groupId);
        
        for (const rank of rankData) {
            const users = await noblox.getPlayers(groupId, rank.id);
            for (const user of users) {
                previousGroupRanks[user.userId] = rank.name;
            }
        }
        // console.log(rankData, previousGroupRanks);
    });
const rankData1 = rankData.slice(1, 11);
const rankChoices = rankData1.map(rank => ({ name: rank.name, value: rank.name }));

module.exports = {
    data: new SlashCommandBuilder()
    .setName(`rank`)
    .setDescription(`Promote or demote a user in the Roblox group.`)
    .addStringOption(option =>
        option.setName(`username`)
            .setDescription(`The Roblox username of the member.`)
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName(`rank`)
            .setDescription(`Select the rank.`)
            .setRequired(true)
            .addChoices(...rankChoices)
    )
    .toJSON(),
    async execute(interaction){
        const username = interaction.options.getString(`username`);
                const rankName = interaction.options.getString(`rank`);
                try {
                    
                    let userId, executorId;
                    
                    
                    try {
                        executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
                    } catch(error) {
                        interaction.editReply(`❌ Your current server nickname does not match any Roblox user.`);
                        return logerror(`Error came with the non matching username: `, error)
                    }
                    const executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
                    if (executorRankIndex < rankData.find(rank => rank.name === `[Instructor]`).rank) {
                        return interaction.editReply(`❌ You do not have permission to use this command.`);
                    }
                    try {
                        userId = await retry(async () => await noblox.getIdFromUsername(username));
                    } catch(error) {
                        logerror(`Error came with the none matching user to be ranked: `, error)
                        return interaction.editReply(`❌ The username "${username}" was not found on Roblox.`);
                    }
                    const targetRankIndex = await retry(async () => await getUserRankIndex(userId))
                    var Action = targetRankIndex < rankData.find(rank => rank.name === rankName).rank;
                    let RankType = "";
                    
                    if (targetRankIndex <= 0){
                        return interaction.editReply(`❌ **${username}** was not found in the group.`)
                    }
                    if (targetRankIndex >= executorRankIndex && interaction.user.id != ownerId) {
                        return interaction.editReply(`❌ You cannot promote or demote someone with a rank equal to or higher than yours.`);
                    }
                    if (rankName === `[Federal Deputy Commander]` || rankData.find(r => r.name === rankName).rank >= rankData.find(r => r.name === `[Federal Deputy Commander]`).rank) {
                        return interaction.editReply(`❌ The bot cannot perform rank changes for or above **[Federal Deputy Commander]**.`);
                    }
                    if (targetRankIndex === rankData.find(r => r.name === rankName).rank){
                        return interaction.editReply(`❌ **${username}** is already at **${rankName}**`)
                    }
                    if (targetRankIndex >= rankData.find(r => r.name === `[Federal Deputy Commander]`).rank){
                        return interaction.editReply(`❌ The bot cannot perform rank changes for those ranked **[Federal Deputy Commander]** or above.`);
                    }
                    if (Action) {
                        RankType = "promoted";
                    } else {
                        RankType = "demoted";
                    }
                    // console.log(targetRankIndex, username)
                    const oldRank = rankData.find(rank => rank.rank === targetRankIndex).name;
                    await retry(async () => {
                        await noblox.setRank(groupId, userId, rankName);
                    });
        
                    const embed = new EmbedBuilder()
                        .setTitle(`Rank Change Successful`)
                        .setDescription(`**${username}** has been successfully ${RankType} to **${rankName}**.`)
                        .setColor(Action ? '#00d907' : "#ad0000")
                        .setTimestamp();
        
                        await interaction.editReply({ embeds: [embed] });
                        const logChannel = await client.channels.fetch(logChannelId);
                        await logChannel.send(`\`The last rank change was made by ${interaction.member.displayName} to ${username} using the rank command.\``)
        
                    } catch (error) {
                    logerror(`Error in rank change: `, error)
                    console.error(`Error handling rank change:`, error);
                    await interaction.editReply(`❌ An error occurred while processing this command.`);
                }
    }
}