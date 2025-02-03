require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, SortOrderType, parseEmoji, Collection } = require('discord.js');
const noblox = require('noblox.js');
const { deploySlashCommands } = require('./utils/commandHandler.js'); // Import the deploy function
const { retry, logstuff } = require("./utils/utils.js")
const { connect_db } = require("./events/mongodb.js")
const { monitorRankChanges } = require("./events/monitorRankChanges.js")
const { startServer } = require("./events/server.js")
const { CheckSuspensions } = require("./events/CheckSuspensions.js")

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

client.once(`ready`, async () => {
    logstuff(client,`✅ Logged in as ${client.user.tag}`);
    startServer();
    await initialize();
    await connect_db();
    logstuff(client, `Successfully connected to MangoDB.`)
    await deploySlashCommands(client, clientId, guildId);
    logstuff(client, `Slash commands successfully deployed.`)
    setInterval(async () => { await monitorRankChanges(client, rankData, previousGroupRanks, isFirstRun) }, 1500);
    setInterval(async () => { await CheckSuspensions(client) }, 30*60*1000)
});

client.on('rateLimit', (rateLimitInfo) => {
    console.warn(`Rate limit hit:`, rateLimitInfo);
});

// Bot login
client.login(botToken).catch((error) => {
    console.error('Failed to login:', error);
    process.exit(1)
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