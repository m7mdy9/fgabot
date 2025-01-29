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
const { parseDuration, 
    makedurationbigger, client,  
    ownerId, logerror, groupId, getUserRankIndex, 
     noblox, chnlsend} = require("../index.js");
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
    .setName(`suspend`)
    .setDescription(`Used to suspend Fedearl Guard Academy members by Deputy Director or higher.`)
    .addUserOption(option =>
        option.setName(`target`)
        .setDescription(`User to be suspended`)
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('duration')
        .setDescription('Duration of the ban (e.g., 1d, 3h, 15m !MUST BE LIKE THAT!)')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName("reason")
        .setDescription("Reason for the suspension")
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName(`proof`)
        .setDescription(`Put the link to the corresponding strike log`)
        .setRequired(true)
     ),
     async execute(interaction){
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
            const embed1 = new EmbedBuilder()
            .setTitle("New Suspension")
            .setColor("DarkNavy")
            .setDescription(`A new suspension has been made!`)
            .setTimestamp(Date.now())
            .addFields([
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
                    {
                    name: "Expiration date",value: `<t:${unbanTime}:F> (<t:${unbanTime}:R>)`,inline: true}
                    ]);
            const  embed2 = new EmbedBuilder()
                    .setTitle("Suspension")
                    .setDescription(`You have been suspending in the Federal Guard Academy for ${makedurationbigger(duration)} for the following reason(s):\n- ${reason} \n\nIf think you got suspended wrongly or something similar, direct message a Deputy Director or higher.`)
                    .setColor("DarkRed")
                    .setTimestamp(Date.now());

            await chnlsend("1332366775811051530", { embeds: [embed1] })
            await usertodm.send({ embeds: [embed2] })
            await interaction.editReply(`User <@!${user.id}> suspended successfully.`)
        } catch(error){
            console.error(error)
            logerror(`Error in suspend: `, error)
        }
     }
}