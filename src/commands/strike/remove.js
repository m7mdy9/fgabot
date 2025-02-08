const { logerror, retry, getUserRankIndex, chnlsend } = require("../../utils/utils.js")
const { StrikeDB } = require("../../utils/mongodb.js")
const noblox = require("noblox.js")
const { groupId, instructor_role_id, strike_channel } = require("../../configs/config.json")
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
            description: "Target user for their strike(s) to be removed.",
            type: 6, // USER type
            required: false
        },
        {
            name: "target_id",
            description: "Id of user, whose strike(s) you want to remove.",
            type: 3, // String type
            required: false   
        },
        {
            name: "number_of_removed_strikes",
            description: "Number of strikes to be removed",
            type: 3,
            required: true,
            choices: ["1 Strike.", "2 Strikes.", "3 Strikes."]
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
        if (interaction.member.roles.highest.position < interaction.guild.roles.cache.get(instructor_role_id).position){
            return interaction.editReply("❌ You do not have permission to use this command.")
        }
        try {
            if(!interaction.options.getUser('target') && !interaction.options.getString("target_id")){
                return interaction.editReply("You must either include the user or their discord ID.")
            }
            const target = await interaction.options.getUser('target')
            const unformatted_no_of_strikes = await interaction.options.getString('number_of_removed_strikes')
            const number_to_be_removed = parseInt(unformatted_no_of_strikes)
            let target_id,strikes_user_has;
            let unequal_strike_values = false;
            if(!target){
                target_id = await interaction.options.getString("target_id")
            } else {
                target_id = target.id
            }
            const usertodm = await client.users.fetch(target_id)
            let user = await StrikeDB.find({
                striked_id: target_id
            }).sort({ strike_number: 1 })
            if(!user){
            return interaction.editReply(`Target, <@!${target_id}> has no strikes..`)
            }
            const length = parseInt(user.length())
            let items1,isequal,strikes_left,idsToDelete,extra_message,actually_removed;
            switch (length){
                case 1: 
                strikes_user_has = 1;
                case 2: 
                strikes_user_has = 2;
                case 3: 
                strikes_user_has = 3;
                default: strikes_user_has = null;
            }
            if(!strikes_user_has) return interaction.editReply(`Target, <@!${target_id}> has no strikes..`);
            if(number_to_be_removed > strikes_user_has){
                unequal_strike_values = true
            }
            if(number_to_be_removed === length){
                actually_removed = number_to_be_removed
                isequal = true
                strikes_left = 0
            }
            if(isequal){
                idsToDelete = user.map(item => item._id);
            } else if(!isequal && !unequal_strike_values){
                items1 = user.slice(-number_to_be_removed)
                idsToDelete = items1.map(item => item._id)
                actually_removed = number_to_be_removed
                strikes_left = strikes_user_has - number_to_be_removed
            }
            if(unequal_strike_values){
                idsToDelete = user.map(item => item._id);
                strikes_left = 0
                actually_removed = strikes_user_has
                extra_message = `<@!${target_id}> does not have ${number_to_be_removed} strikes, they had ${strikes_user_has} and they are now removed.`
            }
            await StrikeDB.deleteMany({ _id: { $in: idsToDelete } });
            await usertodm.send(`A number of ${actually_removed} Strike(s) that you were given, are now removed. You now have ${strikes_left}`)
            await chnlsend(client, strike_channel, `${actually_removed} strike(s) for <@!${target_id}> has been removed by <@!${interaction.user.id}>`)
            await interaction.editReply(extra_message ? extra_message : `Strike(s) for <@!${target_id}> is removed.`)
        } catch (err){
            await interaction.editReply("An error has occured.")
            return logerror(client, `Error in suspension removal`, err)
        }
    }
}