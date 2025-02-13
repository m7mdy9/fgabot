const { embed_builder } = require("../../utils/embeds.js");
const { retry, getUserRankIndex, noblox, parseDuration, makedurationbigger, logerror, chnlsend} = require("../../utils/utils.js")
const { User } = require("../../utils/mongodb.js")
const { groupId, dd_role_id, s } = require("../../configs/config.json")
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
            description: "Duration of the strike (e.g., 1d, 3h, 15m !MUST BE LIKE THAT!)",
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
            name: "proof_link",
            description: "Proof link (MUST INCLUDE ATLEAST ONE PROOF TYPE)",
            type: 3, // STRING type
            required: false
        },
        {
            name: "proof_attachment",
            description: "Proof picture/video (MUST INCLUDE ATLEAST ONE PROOF TYPE)",
            type: 11,
            required: false
        }
    ],
    async execute(interaction){
        const client = interaction.client
        try {
            let executorRankIndex, executorId, proof;
            const user = interaction.options.getUser('target');
            const duration = interaction.options.getString('duration'); // e.g., "1d", "3h"
            const reason = interaction.options.getString('reason')
            const proof_link = interaction.options.getString('proof_link')
            const proof_attach = interaction.options.getAttachment("proof_attachment")
            const member = interaction.guild.members.cache.get(user.id);
            const unbanTime = Math.floor((Date.now() + parseDuration(duration)) / 1000);
            const usertodm = await client.users.fetch(user.id)
            try {
                executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
                executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
                console.log(executorId, executorRankIndex, rankData.find(rank => rank.name === `[Deputy Director]`).rank)
                // if (executorRankIndex < rankData.find(rank => rank.name === `[Deputy Director]`).rank) {
                    //     return interaction.editReply(`❌ You do not have permission to use this command.`);
                    // }
                } catch(error) {
                    console.error(error)
                    // return interaction.editReply(`❌ Your current server nickname does not match any Roblox user.`);
                }
                if (interaction.member.roles.highest.position < interaction.guild.roles.cache.get(dd_role_id).position){
                    return interaction.editReply("❌ You do not have permission to use this command.")
                }
                let user_in_db = await User.findOne({
                    discordId: user.id
                })
                if(user_in_db){
                    return interaction.editReply(`User is already suspended, you may remove this suspension and re-add it if you want to make changes.`)
                }
                if (!parseDuration(duration)){
                    return interaction.editReply("Invalid time usage, use time like this: \n10d (for 10 days), 10h (for 10 hours)\nKeep in mind there is no months nor years.")
                }
                if(!proof_link && !proof_attach){
                    return interaction.editReply("You must include atleast one kind of proof, either a link or an attachment.")
                }
                if(proof_link && proof_attach){
                    proof = `1. ${proof_link}, 2. ${proof_attach.link}`
                } else {
                    proof = proof_link || proof_attach.link
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
                if(proof_attach.contentType.startsWith('./image')){
                    embed1.setImage(proof_attach.url)
                }
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
                suspeneded_name: member.displayName,
                suspended_by: interaction.member.displayName,
                suspender_id: interaction.user.id,
                reason: reason,
                proof: proof,
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
                interaction.editReply("You have entered the wrong time format.\nMake sure it's something like this \"10d\" (10 days).")
            }
            else{
                interaction.editReply("An error has occured.")
            }
            logerror(client,`Error in suspend: `, error)
        }
     }
}