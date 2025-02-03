const { embed_builder } = require("../../utils/embeds.js");
const { retry, getUserRankIndex, noblox, parseDuration, makedurationbigger, logerror, chnlsend} = require("../../utils/utils.js")
const { User } = require("../../events/mongodb.js")
const { groupId } = require("../../configs/config.json")
let rankData = [];
let previousGroupRanks = {};
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

module.exports = {
    name: "add", // Command name
    description: "Used to suspend Federal Guard Academy members by Deputy Director or higher.", // Command description
    options: [ // Define options directly
        {
            name: "target",
            description: "User to be suspended",
            type: 6, // USER type
            required: true
        },
        {
            name: "duration",
            description: "Duration of the ban (e.g., 1d, 3h, 15m !MUST BE LIKE THAT!)",
            type: 3, // STRING type
            required: true
        },
        {
            name: "reason",
            description: "Reason for the suspension",
            type: 3, // STRING type
            required: true
        },
        {
            name: "proof",
            description: "Put the link to the corresponding strike log",
            type: 3, // STRING type
            required: true
        }
    ],
    async execute(interaction){
        const client = interaction.client
        try {
            let executorRankIndex, executorId;
            const user = interaction.options.getUser('target');
            const duration = interaction.options.getString('duration'); // e.g., "1d", "3h"
            const reason = interaction.options.getString('reason')
            const proof = interaction.options.getString('proof')
            const member = interaction.guild.members.cache.get(user.id);
            const unbanTime = Math.floor((Date.now() + parseDuration(duration)) / 1000);
            const usertodm = await client.users.fetch(user.id)
            try {
                executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
                executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
            } catch(error) {
                return interaction.editReply(`❌ Your current server nickname does not match any Roblox user.`);
            }
            
            if (executorRankIndex < rankData.find(rank => rank.name === `[Deputy Director]`).rank) {
                return interaction.editReply(`❌ You do not have permission to use this command.`);
            }
            await member.roles.add("1302266631329808384")
            const embed1 = embed_builder("New Suspension", `A new suspension has been made!`, "DarkNavy")
            embed1.setTimestamp(Date.now())
            embed1.addFields([
                {
                    name: "Suspend",
                    value: `<@!${user.id}>`,
                    inline: true
                },
                {
                    name: "Reason",
                    value: `${reason}`,
                    inline: true
                    },
                    {
                    name: "Duration",
                    value: `This suspension will last for ${makedurationbigger(duration)}`,
                    inline: true
                    },
                    { name: '\u200b', value: '\u200b', inline:false},
                    {
                    name: "Issued by",
                    value: `<@!${interaction.member.id}>`,
                    inline: true
                },
                {name: "Proof",value: proof,inline: true},
                    {
                    name: "Expiration date",value: `<t:${unbanTime}:F> (<t:${unbanTime}:R>)`,inline: true}
                    ]);
            const embed2 = embed_builder("Suspension", 
                `You have been suspended in the Federal Guard Academy for ${makedurationbigger(duration)} for the following reason(s):\n- ${reason} \n\nIf think you got suspended wrongly or something similar, direct message a Deputy Director or higher.`,
                "DarkRed"               
        )
            embed2.setTimestamp(Date.now());
            let user2 = await User.findOne({
                discordId: user.id
            })
            if(user2){
                console.log(user2)
                return interaction.editReply("User already suspended.")
            }
            let user1 = new User({
                discordId: user.id,
                suspended_by: interaction.member.displayName,
                suspender_id: interaction.user.id,
                started_on: (new Date()).toLocaleString(),
                expires_on: new Date(Date.now()+parseDuration(duration)).toLocaleString(),
                in_days: makedurationbigger(duration),
                in_ms: Date.now()+parseDuration(duration),
            })
            await user1.save() 
            await chnlsend(client, "1332366775811051530", { embeds: [embed1] })
            await usertodm.send({ embeds: [embed2] })
            await interaction.editReply(`User <@!${user.id}> suspended successfully.`)
        } catch(error){
            if(error.message === "Invalid usage"){ 
                interaction.editReply("You have entered the wrong time format.")
            }
            else{
                interaction.editReply("An error has occured.")
            }
            logerror(client,`Error in suspend: `, error)
        }
     }
}