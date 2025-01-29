const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

// Load commands dynamically from the 'commands' directory
function loadCommands(client) {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  const commands = [];

  // Dynamically import each command
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command); // Add command to client.commands
    commands.push(command.data.toJSON()); // Prepare for deploying
  }

  return commands;
}

// Deploy slash commands to Discord
async function deploySlashCommands(client, clientId, guildId) {
  const commands = loadCommands(client); // Load commands

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORDTOKEN);

  try {
    console.log('Clearing old commands...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });

    console.log('Deploying new commands...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log('✅ Slash commands deployed successfully!');
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
}

module.exports = { deploySlashCommands };