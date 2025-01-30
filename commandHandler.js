const fs = require("fs");
const path = require("path");
const { REST, Routes, Collection } = require("discord.js");

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    client.commands = new Collection(); // Ensure commands are stored properly
    const commands = [];

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));

        // Call the setup function if it exists
        if (command.setup) {
            await command.setup();
        }

        // ✅ Check if command is structured correctly
        if (!command || !command.data || typeof command.data.toJSON !== "function") {
            console.error(`❌ Skipping "${file}": Missing or invalid "data" property.`);
            continue; // Skip this command
        }

        client.commands.set(command.data.name, command); // Store the command
        commands.push(command.data.toJSON()); // Convert for deployment
    }

    return commands;
}

async function deploySlashCommands(client, clientId, guildId) {
    const commands = await loadCommands(client);

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORDTOKEN);

    try {
        console.log("🗑️ Clearing old commands...");
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });

        console.log("🚀 Deploying new commands...");
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

        console.log("✅ Slash commands deployed successfully!");
    } catch (error) {
        console.error("❌ Error deploying commands:", error);
    }
}

module.exports = { deploySlashCommands };