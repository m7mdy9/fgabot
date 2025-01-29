require("dotenv").config()
const noblox = require("noblox.js")
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { getgroupid } = require("./index.js")
const groupId = getgroupid;

async function getUserRankIndex(userId) {
    try {
        const rank = await noblox.getRankInGroup(groupId, userId);
        return rank;
    } catch (error) {
        logerror(`${error.message}`)
        return -1;
    }
}
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
async function chnlsend(client, channel, message){
    try {
    const logChannel = await client.channels.fetch(channel);
    return await logChannel.send(message)
    } catch(error){
        console.error(error)
    }
}
async function errsend(client, message){
        try {
    const logChannel = await client.channels.fetch(e_channel_Id);
    return await logChannel.send(`Error:\n\`\`\`${message.toString()}\`\`\``)
    } catch(error){
        console.error(error)
    }
}
async function noterrsend(client, message){
        try {
    const asds = await client.channels.fetch(e_channel_Id);
    return await asds.send(`\`\`\`${message.toString()}\`\`\``)
    } catch(error){
        console.error(error)
    }
}
async function logstuff(client, message){
    await noterrsend(client, message)
    return console.log(message)
}
async function logerror(client, message, error){
    if(message === "socket hang up"){
        return console.error(error)
    }
    await errsend(client, message + error.message)
    return console.error(message + error)
}
module.exports = {
    retry,
    parseDuration,
    makedurationbigger,
    chnlsend,
    errsend,
    noterrsend,
    logstuff,
    logerror,
    getUserRankIndex,
    SlashCommandBuilder,
    EmbedBuilder,
    noblox
}