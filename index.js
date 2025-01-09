require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, SortOrderType } = require('discord.js');
const noblox = require('noblox.js');

noblox.settings.timeout = 120000;
const botToken = process.env.DISCORDTOKEN;
const ROBLOSECURITY = process.env.ROBLOXTOKEN;
const groupId = parseInt(process.env.groupID);
const logChannelId = process.env.channelID;
const clientId = process.env.CLIENTID;
const guildId = process.env.GUILDID;
const ownerId = process.env.ownerId

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let rankData = [];
let previousGroupRanks = {};
let isFirstRun = true;

// Retry function to handle timeouts or failed requests
async function retry(fn, maxRetries = 3, delayMs = 2000) {
    let attempts = 0;
    let lastError;
    
    while (attempts < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            attempts++;
            console.error(`Attempt ${attempts} failed. Retrying in ${delayMs / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    // If we reach here, all attempts have failed
    console.error(`Max retries reached. Last error:`, lastError);
    throw lastError; // Rethrow the last error encountered
}

async function initialize() {
    await retry(async () => {
        await noblox.setCookie(ROBLOSECURITY);
        rankData = await noblox.getRoles(groupId);
        
        for (const rank of rankData) {
            const users = await noblox.getPlayers(groupId, rank.id);
            for (const user of users) {
                previousGroupRanks[user.userId] = rank.name;
            }
        }
        isFirstRun = false;
        // console.log(rankData, previousGroupRanks);
    });
}

async function registerSlashCommands(guildId) {
    const rankData1 = rankData.slice(1, 10);
    const rankChoices = rankData1.map(rank => ({ name: rank.name, value: rank.name }));

    const commands = [
        new SlashCommandBuilder()
            .setName(`rank`)
            .setDescription(`Promote or demote a user in the Roblox group.`)
            .addStringOption(option =>
                option.setName(`username`)
                    .setDescription(`The Roblox username of the member.`)
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName(`rank`)
                    .setDescription(`Select the rank.`)
                    .setRequired(true)
                    .addChoices(...rankChoices)
            )
            .toJSON(),
        new SlashCommandBuilder()
            .setName(`phaseupdate`)
            .setDescription(`Sync your current roles with your group rank`),
        new SlashCommandBuilder()
            .setName(`test`)
            .setDescription(`test`)
    ];

    const rest = new REST({ version: `10` }).setToken(botToken);

    try {
        console.log(`Clearing old commands...`);
        await retry(async () => {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        });
        console.log(`✅ Slash commands registered successfully!`);
    } catch (error) {
        console.error(`Error registering commands:`, error);
    }
}

async function getUserRankIndex(userId) {
    try {
        const rank = await noblox.getRankInGroup(groupId, userId);
        return rank;
    } catch (error) {
        return -1;
    }
}

client.on(`interactionCreate`, async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === `rank`) {
        if (interaction.guild.id != guildId){
            return interaction.reply("The bot only works in the Federal Guard Academy server.")
        }
        const username = interaction.options.getString(`username`);
        const rankName = interaction.options.getString(`rank`);
        try {
            await interaction.deferReply();
            let userId, executorId;

            try {
                userId = await retry(async () => await noblox.getIdFromUsername(username));
            } catch(err) {
                return interaction.editReply(`❌ The username "${username}" was not found on Roblox.`);
            }

            try {
                executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
            } catch(err) {
                return interaction.editReply(`❌ Your current Discord display name does not match any Roblox user.`);
            }
            const executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
            const targetRankIndex = await retry(async () => await getUserRankIndex(userId))
            var Action = targetRankIndex < rankData.find(rank => rank.name === rankName).rank;
            let RankType = "";

            if (executorRankIndex < rankData.find(rank => rank.name === `[Instructor]`).rank) {
                return interaction.editReply(`❌ You do not have permission to use this command.`);
            }
            if (targetRankIndex <= 0){
                return interaction.editReply(`❌ **${username}** was not found in the group.`)
            }
            if (targetRankIndex >= executorRankIndex) {
                return interaction.editReply(`❌ You cannot promote or demote someone with a rank equal to or higher than yours.`);
            }
            if (rankName === `[Federal Deputy Commander]` || rankData.find(r => r.name === rankName).rank >= rankData.find(r => r.name === `[Federal Deputy Commander]`).rank) {
                return interaction.editReply(`❌ The bot cannot perform rank changes for or above **[Federal Deputy Commander]**.`);
            }
            if (targetRankIndex === rankData.find(r => r.name === rankName).rank){
                return interaction.editReply(`❌ **${username}** is already at **${rankName}**`)
            }
            if (targetRankIndex >= rankData.find(r => r.name === `[Federal Deputy Commander]`).rank){
                return interaction.editReply(`❌ The bot cannot perform rank changes for those ranked **[Federal Deputy Commander]** or above.`);
            }
            if (Action) {
                RankType = "promoted";
            } else {
                RankType = "demoted";
            }
            // console.log(targetRankIndex, username)
            const oldRank = rankData.find(rank => rank.rank === targetRankIndex).name;
            await retry(async () => {
                await noblox.setRank(groupId, userId, rankName);
            });

            const embed = new EmbedBuilder()
                .setTitle(`Rank Change Successful`)
                .setDescription(`**${username}** has been successfully ${RankType} to **${rankName}**.`)
                .setColor(Action ? '#00d907' : "#ad0000")
                .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                const logChannel = await client.channels.fetch(logChannelId);
                await logChannel.send(`\`The last rank change was made by ${interaction.member.displayName} to ${username} using the rank command.\``)

            } catch (error) {
            console.error(`Error handling rank change:`, error);
            await interaction.editReply(`❌ An error occurred while processing this command.`);
        }
    }
    if (interaction.commandName == `phaseupdate`) {
        if (interaction.guild.id != guildId){
            return interaction.reply("The bot only works in the Federal Guard Academy server.")
        }
        await interaction.deferReply();
        const executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
        const executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
        let UserPhase = ""
        if (executorRankIndex == 0) {
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
        if(UserPhase === ""){
            return interaction.editReply("You do not have any phase role.")
        } else if (executorRankIndex >= 6){
            return interaction.editReply("Instructor+ can not use this command.")
        } else {
            if (executorRankIndex == rankData.find(rank => rank.name === UserPhase).rank) {
                return interaction.editReply(`You already have the correct rank in the group.`);
            }
            try {
                await retry(noblox.setRank(groupId, executorId, UserPhase));
                interaction.editReply(`You have been successfully given ${UserPhase} in the group.`)

            } catch(error){
                console.log("Error while doing the promo/demo command",error)
                interaction.editReply("An error has occured, let mohamed2enany know!")
            }
        }
    }
    if(interaction.commandName === `test`){
        console.log(interaction.guild.id)
        await interaction.deferReply()
        if (interaction.user.id != ownerId){
            return interaction.editReply(`Only <@!${ownerId}> can run this command.`);
        }
        // if (interaction.guild.id != 972498667674140732){
        //     return interaction.reply("The bot only works in the Federal Guard Academy server.")
        // }
        
        async function getAuditLogData() {
            try {
                const auditLogData = await noblox.getAuditLog(groupId, "ChangeRank", 1552234858, "Desc", 10); // Wait for the promise to resolve
                console.log(JSON.stringify(auditLogData)); // Now you can access the actual audit log data
            } catch (error) {
                console.error("Error fetching audit log:", error);
            }
        }
        
        getAuditLogData();
        interaction.editReply("good job")
    }
});
const axios = require('axios');

async function fetchExecutorFromAuditLog(targetId) {
    const currentTime = new Date(); // Current date and time
    const adjustedCurrentTime = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000);
    const twentyMinutesAgo = new Date(adjustedCurrentTime - 20 * 60 * 1000); // 20 minutes ago
    try {
        const auditLogEntries = await noblox.getAuditLog({group: groupId, actionType: "ChangeRank", sortOrder: "Desc", limit: 10});
        const recentActions = auditLogEntries.data.filter(item => item.description.TargetId === targetId)
        const executorsWithRoles = recentActions.map(action => ({
            username: action.actor.user.username,
            role: action.actor.role.name
        }));
    

        
    //     return executorsWithRoles;
    // }        
        return executorsWithRoles
        } catch (error) {
        console.error("Error fetching audit log:", error);
        return null;
        }
}

// async function testAuditLog() {
    
//     try {
//         const response = await axios.get(`https://groups.roblox.com/v1/groups/${groupId}/audit-log`, {
//             headers: {
//                 'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//         console.log("✅ Direct API Response:", response.data);
//     } catch (error) {
//         console.error("❌ Direct API Call Failed:", error.response ? error.response.data : error);
//     }
// }

// testAuditLog();
async function monitorRankChanges() {
    try {
        const logChannel = await client.channels.fetch(logChannelId);
        for (const rank of rankData) {
            const users = await retry(async () => await noblox.getPlayers(groupId, rank.id));
            for (const user of users) {
                const currentRank = rank.name;
                const previousRank = previousGroupRanks[user.userId] || currentRank;
                if (previousRank !== currentRank && !isFirstRun) {
                    const executor = await fetchExecutorFromAuditLog(user.userId);
                    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
                    const action = rankData.find(r => r.name === currentRank).rank > rankData.find(r => r.name === previousRank).rank ? 'Promotion' : 'Demotion';
                    const exevalue = executor[0].username || "Unknown";
                    const exerole =  executor[0].role || "Unknown";
                    const usernamevalue = user.username || "Unknown";
                    const embed = new EmbedBuilder()
                        .setTitle(`FGA ${action}`)
                        .setColor(action === 'Promotion' ? '#00d907' : "#ad0000")
                        .addFields(
                            { name: 'User Executing', value: exevalue, inline: true },
                            { name: 'User\'s Rank', value: exerole, inline: true },
                            { name: 'Unit Affected', value: usernamevalue, inline: true },
                            { name: 'Old Rank', value: previousRank, inline: true },
                            { name: 'New Rank', value: currentRank, inline: true },
                            { name: 'Date', value: `<t:${currentTimestamp}:f>`, inline: true }
                        );
                    await logChannel.send({ embeds: [embed] });
                }
                previousGroupRanks[user.userId] = currentRank;
            }
        }
    } catch (error) {
        console.error('Error monitoring rank changes:', error);
    }
}

// async function leaveothers(){

// }

client.once(`ready`, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await initialize();
    await registerSlashCommands(guildId);
    setInterval(async () => { await monitorRankChanges() }, 1000);
});


// process.on('uncaughtException', (error) => {
//     console.error('Uncaught Exception:', error);
    
//     // Optionally, you can send a notification about this error to a Discord channel here
// });

// // Handle unhandled promise rejections globally
// process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });

// // Add error handling for Discord events
// client.on('error', (error) => {
//     console.error('Discord Client Error:', error);
// });

// client.on('warn', (warning) => {
//     console.warn('Discord Client Warning:', warning);
// });

// Bot login
console.log("yoohoo the bot is working??")
client.login(botToken);
