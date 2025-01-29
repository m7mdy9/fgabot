require('dotenv').config();
const fs = require("fs")
const path = require('path')
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, SortOrderType, parseEmoji, Collection } = require('discord.js');
const noblox = require('noblox.js');

noblox.settings.timeout = 300000;
const botToken = process.env.DISCORDTOKEN;
const ROBLOSECURITY = process.env.ROBLOXTOKEN;
const groupId = parseInt(process.env.groupID);
const logChannelId = process.env.channelID;
const clientId = process.env.CLIENTID;
const guildId = process.env.GUILDID;
const ownerId = process.env.ownerId 
const e_channel_Id = "1332377984195235973";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let rankData = [];
let previousGroupRanks = {};
let isFirstRun = true;

const express = require('express');
const app = express();

// Use the port from the environment variable (Railway assigns this)
const port = process.env.PORT || 3000;

// Define a route to handle incoming requests
app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

// Start the Express server on the port
app.listen(port, () => {
  logstuff(`Server running on port ${port}`);
});
app.get('/favicon.ico', (req, res) => {
  res.status(204); // No Content
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});
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
            const waitTime = delayMs * Math.pow(2, attempts); // Exponential backoff
            console.error(`Attempt ${attempts} failed. Retrying in ${waitTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError; // Rethrow the last error after max retries
}

function parseDuration(duration) {
    const regex = /^(\d+)([dhm])$/; // Matches formats like "1d", "3h", "15m"
    const match = duration.match(regex);

    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000; // Days to milliseconds
        case 'h': return value * 60 * 60 * 1000;      // Hours to milliseconds
        case 'm': return value * 60 * 1000;          // Minutes to milliseconds
        default: return null;
    }
}
function makedurationbigger(duration) {
    const regex = /^(\d+)([dhm])$/; // Matches formats like "1d", "3h", "15m"
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
        case 'd': return value + " days" // Days to milliseconds
        case 'h': return value +  " hours"   // Hours to milliseconds
        case 'm': return value + " minutes"        // Minutes to milliseconds
        default: return null;
    }
    
}
async function chnlsend(channel, message){
    try {
    const logChannel = await client.channels.fetch(channel);
    return await logChannel.send(message)
    } catch(error){
        console.error(error)
    }
}
async function errsend(message){
        try {
    const logChannel = await client.channels.fetch(e_channel_Id);
    return await logChannel.send(`Error:\n\`\`\`${message.toString()}\`\`\``)
    } catch(error){
        console.error(error)
    }
}
async function noterrsend(message){
        try {
    const asds = await client.channels.fetch(e_channel_Id);
    return await asds.send(`\`\`\`${message.toString()}\`\`\``)
    } catch(error){
        console.error(error)
    }
}
async function logstuff(message){
    await noterrsend(message)
    return console.log(message)
}
async function logerror(message, error){
    if(message === "socket hang up"){
        return console.error(error)
    }
    await errsend(message + error.message)
    return console.error(message + error)
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
const commandsPath = path.join(__dirname, 'commands');

// Load all command files from the 'commands' folder
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

// Dynamically import each command from the 'commands' folder
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.push(command);
}

// Deploy slash commands to Discord
async function deploySlashCommands() {
    const rest = new REST({ version: '10' }).setToken(botToken);

    try {
        logstuff('Clearing old commands...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });

        logstuff('Deploying new commands...');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

        logstuff('✅ Slash commands deployed successfully!');
    } catch (error) {
        logerror('Error deploying commands:', error);
    }
}
// async function registerSlashCommands(guildId) {
    // const rankData1 = rankData.slice(1, 11);
    // const rankChoices = rankData1.map(rank => ({ name: rank.name, value: rank.name }));

//     const commands = [
//         new SlashCommandBuilder()
            // .setName(`rank`)
            // .setDescription(`Promote or demote a user in the Roblox group.`)
            // .addStringOption(option =>
            //     option.setName(`username`)
            //         .setDescription(`The Roblox username of the member.`)
            //         .setRequired(true)
            // )
            // .addStringOption(option =>
            //     option.setName(`rank`)
            //         .setDescription(`Select the rank.`)
            //         .setRequired(true)
            //         .addChoices(...rankChoices)
            // )
            // .toJSON(),
//         new SlashCommandBuilder()
//             .setName(`phaseupdate`)
//             .setDescription(`Sync your current group roles with current roles`),
//         new SlashCommandBuilder()
//             .setName(`test`)
//             .setDescription(`test`),
//             new SlashCommandBuilder()
//             .setName(`info`)
//             .setDescription(`Information`),
//         new SlashCommandBuilder()
            // .setName(`suspend`)
            // .setDescription(`Used to suspend Fedearl Guard Academy members by Deputy Director or higher.`)
            // .addUserOption(option =>
            //     option.setName(`target`)
            //     .setDescription(`User to be suspended`)
            //     .setRequired(true)
            // )
            // .addStringOption(option =>
            //     option.setName('duration')
            //     .setDescription('Duration of the ban (e.g., 1d, 3h, 15m !MUST BE LIKE THAT!)')
            //     .setRequired(true)
            // )
            // .addStringOption(option =>
            //     option.setName("reason")
            //     .setDescription("Reason for the suspension")
            //     .setRequired(true)
            // )
            // .addStringOption(option =>
            //     option.setName(`proof`)
            //     .setDescription(`Put the link to the corresponding strike log`)
            //     .setRequired(true)
            //  )
//     ];

//     const rest = new REST({ version: `10` }).setToken(botToken);

//     try {
//         logstuff(`Clearing old commands...`);
//         await retry(async () => {
//             await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
//             await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
//         });
//         logstuff(`✅ Slash commands registered successfully!`);
//     } catch (error) {
//         logerror(`${error.message}`)
//         console.error(`Error registering commands:`, error);
//     }
// }
async function getUserRankIndex(userId) {
    try {
        const rank = await noblox.getRankInGroup(groupId, userId);
        return rank;
    } catch (error) {
        logerror(`${error.message}`)
        return -1;
    }
}
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        // Pass client to the comman
        await interaction.deferReply();
        if (interaction.guild.id != guildId && interaction.user.id != ownerId){
            return interaction.editReply("The bot only works in the Federal Guard Academy server.")
        }
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
    }
});

// client.on(`interactionCreate`, async interaction => {
//     if (!interaction.isCommand()) return;

//     await interaction.deferReply();
//     if (interaction.guild.id != guildId && interaction.user.id != ownerId){
//         return interaction.editReply("The bot only works in the Federal Guard Academy server.")
//     }

//     if (interaction.commandName === `rank`) {
//         const username = interaction.options.getString(`username`);
//         const rankName = interaction.options.getString(`rank`);
//         try {
            
//             let userId, executorId;
            
            
//             try {
//                 executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
//             } catch(error) {
//                 interaction.editReply(`❌ Your current server nickname does not match any Roblox user.`);
//                 return logerror(`Error came with the non matching username: ${error.message}`)
//             }
//             const executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
//             if (executorRankIndex < rankData.find(rank => rank.name === `[Instructor]`).rank) {
//                 return interaction.editReply(`❌ You do not have permission to use this command.`);
//             }
//             try {
//                 userId = await retry(async () => await noblox.getIdFromUsername(username));
//             } catch(error) {
//                 logerror(`Error came with the none matching user to be ranked: ${error.message}`)
//                 return interaction.editReply(`❌ The username "${username}" was not found on Roblox.`);
//             }
//             const targetRankIndex = await retry(async () => await getUserRankIndex(userId))
//             var Action = targetRankIndex < rankData.find(rank => rank.name === rankName).rank;
//             let RankType = "";
            
//             if (targetRankIndex <= 0){
//                 return interaction.editReply(`❌ **${username}** was not found in the group.`)
//             }
//             if (targetRankIndex >= executorRankIndex && interaction.user.id != ownerId) {
//                 return interaction.editReply(`❌ You cannot promote or demote someone with a rank equal to or higher than yours.`);
//             }
//             if (rankName === `[Federal Deputy Commander]` || rankData.find(r => r.name === rankName).rank >= rankData.find(r => r.name === `[Federal Deputy Commander]`).rank) {
//                 return interaction.editReply(`❌ The bot cannot perform rank changes for or above **[Federal Deputy Commander]**.`);
//             }
//             if (targetRankIndex === rankData.find(r => r.name === rankName).rank){
//                 return interaction.editReply(`❌ **${username}** is already at **${rankName}**`)
//             }
//             if (targetRankIndex >= rankData.find(r => r.name === `[Federal Deputy Commander]`).rank){
//                 return interaction.editReply(`❌ The bot cannot perform rank changes for those ranked **[Federal Deputy Commander]** or above.`);
//             }
//             if (Action) {
//                 RankType = "promoted";
//             } else {
//                 RankType = "demoted";
//             }
//             // console.log(targetRankIndex, username)
//             const oldRank = rankData.find(rank => rank.rank === targetRankIndex).name;
//             await retry(async () => {
//                 await noblox.setRank(groupId, userId, rankName);
//             });

//             const embed = new EmbedBuilder()
//                 .setTitle(`Rank Change Successful`)
//                 .setDescription(`**${username}** has been successfully ${RankType} to **${rankName}**.`)
//                 .setColor(Action ? '#00d907' : "#ad0000")
//                 .setTimestamp();

//                 await interaction.editReply({ embeds: [embed] });
//                 const logChannel = await client.channels.fetch(logChannelId);
//                 await logChannel.send(`\`The last rank change was made by ${interaction.member.displayName} to ${username} using the rank command.\``)

//             } catch (error) {
//             logerror(`Error in rank change: ${error.message}`)
//             console.error(`Error handling rank change:`, error);
//             await interaction.editReply(`❌ An error occurred while processing this command.`);
//         }
//     }
//     if (interaction.commandName == `phaseupdate`) {
//         const executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
//         const executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
//         let UserPhase = ""
//         if (executorRankIndex <= 0) {
//             return interaction.editReply(`You are not in the group. Join the [Federal Guard Academy group](<https://www.roblox.com/communities/35417960/FRP-Federal-Guard-Academy#!/about>).`);
//         }
//         const executorRoles = interaction.member.roles.cache.map(role => role.name);
//         // console.log(executorRoles);
//         const Phases = [
//             "[Phase 1]","[Phase 2]","[Phase 3]","[Phase 4]","[Phase 5]"
//         ]
//         for (let phase of Phases){
//             // console.log(phase)
//             if (executorRoles.includes(phase)){
//                 UserPhase = phase;
//                 // console.log(UserPhase)
//                 break;
//             }
//         }

//             try {
//                 if(UserPhase === ""){
//                     return interaction.editReply("You do not have any phase role.")
//                 } 
//                 if (executorRankIndex >= 6){
//                     return interaction.editReply("Instructor+ can not use this command.")
//                 } 
//                     if (executorRankIndex == rankData.find(rank => rank.name === UserPhase).rank) {
//                         return interaction.editReply(`You already have the correct rank in the group.`);
//                     }
//                 await retry(noblox.setRank(groupId, executorId, UserPhase));
//                 interaction.editReply(`You have been successfully given ${UserPhase} in the group.`)

//             } catch(error){
//                 logerror(`Error in phase change: ${error.message}`)
//                 interaction.editReply("An error has occured, let mohamed2enany know!")
//             }
//     }
//     if(interaction.commandName === `test`){
//         logstuff(interaction.guild.id)
//         if (interaction.user.id != ownerId){
//             return interaction.editReply(`Only <@!${ownerId}> can run this command.`);
//         }
//         // if (interaction.guild.id != 972498667674140732){
//         //     return interaction.reply("The bot only works in the Federal Guard Academy server.")
//         // }
        
//         async function getAuditLogData() {
//             try {
//                 const auditLogData = await noblox.getAuditLog(groupId, "ChangeRank", 1552234858, "Desc", 10); // Wait for the promise to resolve
//                 console.log(JSON.stringify(auditLogData)); //DO NOT CHANGE TO logstuff
//             } catch (error) {
//                 logerror(`Error in audit logs: ${error.message}`)
//                 console.error("Error fetching audit log:", error);
//                 return interaction.editReply("bad job, error happen")
//             }
//         }        
//         getAuditLogData();
//         interaction.editReply("good job")
//     }
//     if(interaction.commandName === `info`){
//         try {
//         let result = Math.round(interaction.client.uptime / 60000)
//         let time = "minutes"
//         if (result >= 60){
//             let result1 = result / 60
// 			result = result1.toFixed(1)
//             if (result >= 24){
//             result1 = result / 24
//             result = result1.toFixed(1)
//             time = "days"
//             } else {
//                     time = "hours"
//             }
//         }
//         const embed1 = new EmbedBuilder()
//             .setTitle("Information")
//             .setDescription(`
//                 The bot was developed and made by <@!${ownerId}> 
//                 \n\nCurrent Ping for the bot is: **${client.ws.ping}ms** (Can be inaccurate) \n\n
//                 Uptime: **${result} ${time}**
//                 `)
//             .setColor("DarkBlue")
//             await interaction.editReply({ embeds: [embed1] });
//         } catch (error){
//             logerror(`Error in info: ${error.message}`)
//             console.error(error)
//         }
//     }
//     if(interaction.commandName === `suspend`){

//         try {
//             let executorRankIndex, executorId;
//             const user = interaction.options.getUser('target');
//             const duration = interaction.options.getString('duration'); // e.g., "1d", "3h"
//             const reason = interaction.options.getString('reason')
//             const proof = interaction.options.getString('proof')
//             const member = interaction.guild.members.cache.get(user.id);
//             const unbanTime = Math.floor((Date.now() + parseDuration(duration)) / 1000);
//             const usertodm = await client.users.fetch(user.id)
//             try {
//                 executorId = await retry(async () => await noblox.getIdFromUsername(interaction.member.displayName));
//                 executorRankIndex = await retry(async () => await getUserRankIndex(executorId));
//             } catch(error) {
//                 return interaction.editReply(`❌ Your current server nickname does not match any Roblox user.`);
//             }
            
//             if (executorRankIndex < rankData.find(rank => rank.name === `[Deputy Director]`).rank) {
//                 return interaction.editReply(`❌ You do not have permission to use this command.`);
//             }
//             await member.roles.add("1302266631329808384")
//             const embed1 = new EmbedBuilder()
//             .setTitle("New Suspension")
//             .setColor("DarkNavy")
//             .setDescription(`A new suspension has been made!`)
//             .setTimestamp(Date.now())
//             .addFields([
//                 {
//                   name: "Suspend",
//                   value: `<@!${user.id}>`,
//                   inline: true
//                 },
//                 {
//                     name: "Reason",
//                     value: `${reason}`,
//                     inline: true
//                   },
//                   {
//                     name: "Duration",
//                     value: `This suspension will last for ${makedurationbigger(duration)}`,
//                     inline: true
//                   },
//                   { name: '\u200b', value: '\u200b', inline:false},
//                   {
//                     name: "Issued by",
//                     value: `<@!${interaction.member.id}>`,
//                     inline: true
//                   },
//                   {
//                     name: "Expiration date",value: `<t:${unbanTime}:F> (<t:${unbanTime}:R>)`,inline: true}
//                   ]);
//             const  embed2 = new EmbedBuilder()
//                   .setTitle("Suspension")
//                   .setDescription(`You have been suspending in the Federal Guard Academy for ${makedurationbigger(duration)} for the following reason(s):\n- ${reason} \n\nIf think you got suspended wrongly or something similar, direct message a Deputy Director or higher.`)
//                   .setColor("DarkRed")
//                   .setTimestamp(Date.now());

//             await chnlsend("1332366775811051530", { embeds: [embed1] })
//             await usertodm.send({ embeds: [embed2] })
//             await interaction.editReply(`User <@!${user.id}> suspended successfully.`)
//         } catch(error){
//             console.error(error)
//             logerror(`Error in suspend: ${error.message}`)
//         }
//     }
// });
// const axios = require('axios');
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
        logerror(`Error in fetch Audit log: ${error.message}`)
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
                    let exevalue,exerole;
                    try {
                    exevalue = executor[0].username
                    exerole = executor[0].role
                } catch (error){
                    logerror(`Error in the values for promo embed: ${error.message}`)
                    exevalue = "Unknown"
                    exerole = "Unknown"
                }
                    const usernamevalue = user.username || "Unknown";
                    const embed = new EmbedBuilder()
                        .setTitle(`FGA ${action}`)
                        .setColor(action === 'Promotion' ? '#00d907' : "#ad0000")
                        .addFields(
                            { name: 'User Executing', value: exevalue, inline: true },
                            { name: 'User\'s Rank', value: exerole, inline: true },
                            { name: 'Unit Affected', value: usernamevalue, inline: true },
                            { name: '\u200b', value: '\u200b', inline:false},
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
        const logChannel = await client.channels.fetch(logChannelId);
if (logChannel) logChannel.send("An error has occurred.");
        logerror(`Error in rank minotring: ${error.message}`)
        console.error('Error monitoring rank changes:', error);
    }
}

// async function leaveothers(){

// }

client.once(`ready`, async () => {
    logstuff(`✅ Logged in as ${client.user.tag}`);
    await initialize();
    await deploySlashCommands();
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
client.on('rateLimit', (rateLimitInfo) => {
    console.warn(`Rate limit hit:`, rateLimitInfo);
});

// Bot login
client.login(botToken).catch((error) => {
    console.error('Failed to login:', error);
});
Object.getOwnPropertyNames(module.exports).forEach(name => {
    if (typeof module.exports[name] === 'function') {
        exports[name] = module.exports[name];
    }
});
module.exports = { ...exports, SlashCommandBuilder, noblox, client, 
    EmbedBuilder, groupId, logChannelId, clientId, 
    guildId, ownerId, e_channel_Id, retry, 
    parseDuration, makedurationbigger, chnlsend, 
    errsend, noterrsend, logstuff, logerror,  
    getUserRankIndex,   
    fetchExecutorFromAuditLog, rankData }