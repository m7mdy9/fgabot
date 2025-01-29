async function retry(fn, maxRetries = 3, delayMs = 2000) {
    let attempts = 0;
    let lastError;

    while (attempts < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            attempts++;
            const waitTime = delayMs * Math.pow(2, attempts); // Exponential backoff
            console.error(`Attempt ${attempts} failed. Retrying in ${waitTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError; // Rethrow the last error after max retries
}
const { logerror, groupId, getUserRankIndex, noblox} = require("../index.js");

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
const { SlashCommandBuilder, EmbedBuilder} = require("discord.js")
module.exports = {
    data: new SlashCommandBuilder()
    .setName(`phaseupdate`)
    .setDescription(`Sync your current group roles with current roles`),
    async execute(interaction){
        const executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
        const executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
        let UserPhase = ""
        if (executorRankIndex <= 0) {
            return interaction.editReply(`You are not in the group. Join the [Federal Guard Academy group](<https://www.roblox.com/communities/35417960/FRP-Federal-Guard-Academy#!/about>).`);
        }
        const executorRoles = interaction.member.roles.cache.map(role => role.name);
        // console.log(executorRoles);
        const Phases = [
            "[Phase 1]","[Phase 2]","[Phase 3]","[Phase 4]","[Phase 5]"
        ]
        for (let phase of Phases){
            // console.log(phase)
            if (executorRoles.includes(phase)){
                UserPhase = phase;
                // console.log(UserPhase)
                break;
            }
        }

            try {
                if(UserPhase === ""){
                    return interaction.editReply("You do not have any phase role.")
                } 
                if (executorRankIndex >= 6){
                    return interaction.editReply("Instructor+ can not use this command.")
                } 
                    if (executorRankIndex == rankData.find(rank => rank.name === UserPhase).rank) {
                        return interaction.editReply(`You already have the correct rank in the group.`);
                    }
                await retry(noblox.setRank(groupId, executorId, UserPhase));
                interaction.editReply(`You have been successfully given ${UserPhase} in the group.`)

            } catch(error){
                logerror(`Error in phase change: `, error)
                interaction.editReply("An error has occured, let mohamed2enany know!")
            }
    }
}