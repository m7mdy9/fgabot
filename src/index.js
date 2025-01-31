require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, SortOrderType, parseEmoji, Collection } = require('discord.js');
const noblox = require('noblox.js');
const { deploySlashCommands } = require('./utils/commandHandler.js'); // Import the deploy function
const { retry, logstuff, logerror } = require("./utils/utils.js")
const express = require('express');

noblox.settings.timeout = 300000;
const botToken = process.env.DISCORDTOKEN;
const ROBLOSECURITY = process.env.ROBLOXTOKEN;
const groupId = parseInt(process.env.groupID);
const logChannelId = process.env.channelID;
const clientId = process.env.CLIENTID;
const guildId = process.env.GUILDID;
const ownerId = process.env.ownerId 
const error_channel_id = process.env.e_channel_Id || ""
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let rankData = [];
let previousGroupRanks = {};
let isFirstRun = true;
client.commands = new Collection();
const app = express();

// Use the port from the environment variable (Railway assigns this)
const port = process.env.PORT || 3000;
// Define a route to handle incoming requests
app.get('/', (req, res) => {
  res.send('Bot is alive!');
});


// Start the Express server on the port
app.listen(port, () => {
  logstuff(client,`Server running on port ${port}`);
});
app.get('/favicon.ico', (req, res) => {
  res.status(204); // No Content
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});
// Retry function to handle timeouts or failed requests

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
        logerror(client, `Error in fetch Audit log: `, error)
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
                    logerror(client, `Error in the values for promo embed: `, error)
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
        logerror(client, `Error in rank minotring: `, error)
        console.error('Error monitoring rank changes:', error);
    }
}
client.once(`ready`, async () => {
    logstuff(client,`✅ Logged in as ${client.user.tag}`);
    await initialize();
    await deploySlashCommands(client, clientId, guildId);
    logstuff(client, `Slash commands successfully deployed.`)
    setInterval(async () => { await monitorRankChanges() }, 1000);
});

client.on('rateLimit', (rateLimitInfo) => {
    console.warn(`Rate limit hit:`, rateLimitInfo);
});

// Bot login
client.login(botToken).catch((error) => {
    console.error('Failed to login:', error);
});

function getlogchannelid(){
    return logChannelId
}
function getechannelid(){
    return error_channel_id
}

module.exports = {
    getlogchannelid,
    getechannelid
}