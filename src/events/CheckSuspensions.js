const { User } = require("./mongodb.js");
const { guildId, suspension_role_id } = require("../configs/config.json");

async function CheckSuspensions(client) {
    try {
        const guild = client.guilds.cache.get(guildId);
        const users = await User.find();
        const rn = Date.now();

        for (const user of users) {
            try{
                const member = await guild.members.fetch(user.discordId);
                if(!member){
                    return console.warn(`${user.discordId} is not in the server.`)
                }
                const executorRoles = member.roles.cache.map(role => role.name);
                if(!executorRoles.includes("Suspended")){
                member.roles.add(suspension_role_id)
                }
            } catch (err){
                return console.warn(`${user.discordId} is not in the server so his roles were not removed.`)
            }
            const expiry_in_ms = user.in_ms
            if (rn >= expiry_in_ms) {
                await user.deleteOne(); // Await the deletion
                console.log(`Deleted user ${user._id} ${user.discordId} due to suspension expiry.`);
                const usertodm = await client.users.fetch(user.discordId)
                await usertodm.send(`Your suspension has expired.`)
            }
        }
    } catch (err){
        console.error(err)
    }
}

module.exports = {
    CheckSuspensions
};