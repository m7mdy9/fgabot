    const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
    const { logstuff } = require("../utils/utils.js")
    const { getclient } = require("../index.js")
    const { User, StrikeDB } = require("../utils/mongodb.js")
    require('dotenv').config({ path: '../.env' })
    const ownerId = process.env.ownerId
    module.exports = {
        name: "test",
        description: "A test command",
        options: [
            {
                name: "thingy",
                description: "what to save",
                type: 3, // STRING type
                required: false        
            },
            {
                name: "yes",
                description: "yes or no",
                type: 3, // STRING type
                required: false        
            }
        ],
        async execute(interaction){
            const client = interaction.client
            if (interaction.user.id != ownerId){
                return interaction.editReply(`Only <@!${ownerId}> can run this command.`)
            }
            if(interaction.options.getString("thingy")){
                const thingy = interaction.options.getString("thingy");
                let user = await User.findOne({ discordId: interaction.user.id })
                // if(!user){
                    user = new User({
                        discordId: interaction.user.id,
                        suspended_by: thingy
                    })
                await user.save()
                // }
                console.log(user)
                console.log(`${user}` + `\n` + `${User}`)
            }
            if(interaction.options.getString("yes")){
                let user1 = await User.find({}).sort({ started_on: -1 })
                console.log(user1)
                let strikedb = await StrikeDB.find({}).sort({ started_on: -1 })
                console.log(strikedb)
            }
            logstuff(client, interaction.guild.id)
            interaction.editReply(`good job`)
        }
    }
