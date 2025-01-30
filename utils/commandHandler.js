const fs = require("fs");
const path = require("path");
const { REST, Routes, Collection } = require("discord.js");

async function loadCommands(client) {
    const targetdir = path.dirname(__dirname)
    const commandsPath = path.join(targetdir, "commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    client.commands = new Collection(); // Store commands
    const commands = [];

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));

        // Call the setup function if it exists
        if (command.setup) {
            await command.setup(client); // Pass client if needed
        }

        // ✅ Automatically generate the `data` object if it doesn't exist
        if (!command.data) {
            command.data = {
                name: command.name || file.replace(".js", ""), // Use file name as fallback
                description: command.description || "No description provided",
                options: command.options || [] // Default to no options
            };
        }

        // Validate the command structure
        if (!command.data.name || !command.data.description) {
            console.error(`❌ Skipping "${file}": Missing required "name" or "description" properties.`);
            continue;
        }

        client.commands.set(command.data.name, command); // Store the command
        commands.push(command.data); // Add to deployment list
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