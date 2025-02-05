const { logerror, retry, getUserRankIndex } = require("../../utils/utils.js")
const { User } = require("../../utils/mongodb.js")
const noblox = require("noblox.js")
const { groupId, dd_role_id } = require("../../configs/config.json")
require('dotenv').config()
// let rankData = [];
// let previousGroupRanks = {};
// retry(async () => {
//     rankData = await noblox.getRoles(groupId);
    
//     for (const rank of rankData) {
//         const users = await noblox.getPlayers(groupId, rank.id);
//         for (const user of users) {
//             previousGroupRanks[user.userId] = rank.name;
//         }
//     }
//     // console.log(rankData, previousGroupRanks);
// });


module.exports = {
    name: "remove", // Command name
    description: "Used to remove suspensions by Deputy Director or higher.", // Command description
    options: [ // Define options directly
        {
            name: "target",
            description: "Target user for their suspension to be removed.",
            type: 6, // USER type
            required: false
        },
        {
            name: "target_id",
            description: "Id of user, whose suspension you want to remove.",
            type: 3, // String type
            required: false   
        }
    ],
    async execute(interaction){
        const client = interaction.client
        // let executorId, executorRankIndex;
        // try {
        //     executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
        //     executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
        // } catch(error) {
        //     return interaction.editReply(`❌ Your current server nickname does not match any Roblox user.`);
        // }
        
        // if (executorRankIndex < rankData.find(rank => rank.name === `[Deputy Director]`).rank) {
        //     return interaction.editReply(`❌ You do not have permission to use this command.`);
        // }
        if (interaction.member.roles.highest.position < interaction.guild.roles.cache.get(dd_role_id).position){
            return interaction.editReply("❌ You do not have permission to use this command.")
        }
        try {
            if(!interaction.options.getUser('target') && !interaction.options.getString("target_id")){
                return interaction.editReply("You must either include the user or their discord ID.")
            }
            const target = interaction.options.getUser('target')
            let target_id;
            if(!target){
                target_id = interaction.options.getString("target_id")
            } else {
                target_id = target.id
            }
            const usertodm = await client.users.fetch(target_id)
            let user = await User.findOneAndDelete({
                discordId: target_id
            })
            if(user){
                await usertodm.send(`Your suspension have been removed.`)
                return interaction.editReply(`Suspension for <@!${target_id}> is removed.`)
            } else {
                return interaction.editReply(`Target, <@!${target_id}> is not suspended.`)
            }
        } catch (err){
            logerror(client, `Error in suspension removal`, err)
        }
    }
}