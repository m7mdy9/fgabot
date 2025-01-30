require('dotenv').config();
const fs = require("fs")
const path = require('path')
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, SortOrderType, parseEmoji, Collection } = require('discord.js');
const noblox = require('noblox.js');
const { deploySlashCommands } = require('./commandHandler.js'); // Import the deploy function

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
client.commands = new Collection();
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
         
        return executorsWithRoles
        } catch (error) {
        console.error("Error fetching audit log:", error);
        logerror(`Error in fetch Audit log: ${error.message}`)
        return null;
        }
}
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
client.once(`ready`, async () => {
    logstuff(`✅ Logged in as ${client.user.tag}`);
    await initialize();
    await deploySlashCommands(client, clientId, guildId);
    setInterval(async () => { await monitorRankChanges() }, 1000);
});

client.on('rateLimit', (rateLimitInfo) => {
    console.warn(`Rate limit hit:`, rateLimitInfo);
});

// Bot login
client.login(botToken).catch((error) => {
    console.error('Failed to login:', error);
});
function getclient(){
    return client || ""
}
function getlogchannelid(){
    return logChannelId || ""
}
module.exports = {
getlogchannelid
}