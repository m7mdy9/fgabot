const { embed_builder } = require("../../utils/embeds.js");
const { retry, getUserRankIndex, noblox, parseDuration, makedurationbigger, logerror, chnlsend} = require("../../utils/utils.js")
const { StrikeDB } = require("../../utils/mongodb.js")
const { groupId, dd_role_id, strike_channel, strike1_id, strike2_id, strike3_id } = require("../../configs/config.json")
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
    description: "Add a strike.", // Command description
    options: [ // Define options directly
        {
            name: "target",
            description: "User to be strike",
            type: 6, // USER type
            required: true
        },
        {
            name: "reason",
            description: "Reason for the strike",
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
            const reason = interaction.options.getString('reason')
            const proof_link = interaction.options.getString('proof_link')
            const proof_attach = interaction.options.getAttachment("proof_attachment")
            const member = interaction.guild.members.cache.get(user.id);
            const member_roles = member.roles.cache.map(role => role.id);
            const usertodm = await client.users.fetch(user.id)
            const strikes_ids = [strike1_id, strike2_id, strike3_id]
            let strike_number, duration_of_strike;
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
                if(!proof_link && !proof_attach){
                    return interaction.editReply("You must include atleast one kind of proof, either a link or an attachment.")
                }
                if(proof_link && proof_attach){
                    proof = `1. ${proof_link}, 2. ${proof_attach.link}`
                } else {
                    proof = proof_link || proof_attach.link
                }
                if(member_roles.includes(strike1_id)){
                    strike_number = 2
                    duration_of_strike = parseDuration('120d')
                }
                if(member_roles.includes(strike2_id)){
                    strike_number = 3
                    duration_of_strike = parseDuration('180d')
                }
                if(member_roles.includes(strike3_id)){
                    return interaction.editReply("User is already at their 3rd strike.")
                }
                if(!member.roles.includes(strikes_ids)){
                    strike_number = 1
                    duration_of_strike = parseDuration('60d')
                }
                const unbanTime = Math.floor((Date.now() + duration_of_strike) / 1000 );
                var strike_role = strikes_ids[strike_number-1]
            await member.roles.add(strike_role)
            const embed1 = embed_builder("New Strike", `A new strike has been made!`, "DarkRed")
            embed1.setTimestamp(Date.now())
            embed1.addFields([
                {
                    name: "Striked",
                    value: `<@!${user.id}>`,
                    inline: true
                },
                {
                    name: "Reason",
                    value: `${reason}`,
                    inline: true
                    },
                    {
                        name: "Issued by",
                        value: `<@!${interaction.member.id}>`,
                        inline: true
                    },
                    { name: '\u200b', value: '\u200b', inline:false},
                {name: "Proof",value: proof,inline: true},
                    {
                    name: "Expiration date",value: `<t:${unbanTime}:F> (<t:${unbanTime}:R>)`,inline: true}
                    ]);
                    if(proof_attach.contentType.startsWith('./image')){
                        embed1.setImage(proof_attach.url)
                    }
            const embed2 = embed_builder("Strike", 
                `You have been striked in the Federal Guard Academy for the following reason(s):\n- ${reason} \n\nYou now have ${strike_number} strikes.`,
                "DarkRed"               
        )
            embed2.setTimestamp(Date.now())
            embed2.setFooter('If you have any concerns, contact a Deputy Director or higher.')
            let user1 = new StrikeDB({
                striked_id: user.id,
                striked_name: member.displayName,
                strike_no: strike_number,
                striker_name: interaction.member.displayName,
                striker_id: interaction.user.id,
                reason: reason,
                proof: proof,
                started_on: (new Date()).toLocaleString(),
                expiry_date: new Date(Date.now() + parseDuration(duration_of_strike)).toLocaleString(),
                in_ms: parseDuration(duration_of_strike),
            })

            await user1.save() 
            await chnlsend(client, strike_channel, { embeds: [embed1] })
            await usertodm.send({ embeds: [embed2] })
            await interaction.editReply(`User <@!${user.id}> striked successfully, the number of strikes that the user has is ${strike_number}.`)
        } catch(error){
            interaction.editReply("An error has occured.")
            logerror(client,`Error in strike: `, error)
        }
     }
}