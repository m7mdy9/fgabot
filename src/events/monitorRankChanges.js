const { promo_channel, groupId } = require("../configs/config.json")
const noblox = require("noblox.js")
const { logerror } = require("../utils/utils")
const { embed_rankchange } = require("../utils/embeds.js")
const { fetchExecutorFromAuditLog, retry } = require("../utils/utils.js")

async function monitorRankChanges(client, rankData, previousGroupRanks, isFirstRun) {
    try {
        const logChannel = await client.channels.fetch(promo_channel);
        for (const rank of rankData) {
            const users = await retry(async () => await noblox.getPlayers(groupId, rank.id));
            for (const user of users) {
                const currentRank = rank.name;
                const previousRank = previousGroupRanks[user.userId] || currentRank;
                if (previousRank !== currentRank && !isFirstRun) {
                    const executor = await fetchExecutorFromAuditLog(user.userId);
                    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
                    const action = rankData.find(r => r.name === currentRank).rank > rankData.find(r => r.name === previousRank).rank ? 'Promotion' : 'Demotion';
                    let exevalue,exerole;
                    const timestamp = `<t:${currentTimestamp}:f>`
                    try {
                    exevalue = executor[0].username
                    exerole = executor[0].role
                } catch (error){
                    logerror(client, `Error in the values for promo embed: `, error)
                    exevalue = "Unknown"
                    exerole = "Unknown"
                }
                    const usernamevalue = user.username || "Unknown";
                    const embed = embed_rankchange(action, exevalue, exerole, usernamevalue, previousRank, currentRank, timestamp) 
                    await logChannel.send({ embeds: [embed] });
                }
                previousGroupRanks[user.userId] = currentRank;
            }
        }
    } catch (error) {
        const logChannel = await client.channels.fetch(promo_channel);
        if (logChannel) logChannel.send("An error has occurred.");
        logerror(client, `Error in rank minotring: `, error)
        console.error('Error monitoring rank changes:', error);
    }
}

module.exports = {
    monitorRankChanges
}