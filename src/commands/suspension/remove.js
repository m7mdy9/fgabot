const { logerror} = require("../../utils/utils.js")
const { User } = require("../../events/mongodb.js")
require('dotenv').config()

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