const { retry, getUserRankIndex, noblox, parseDuration, makedurationbigger, logerror, chnlsend} = require("../../utils/utils.js")
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const { StrikeDB } = require("../../utils/mongodb.js")
const { embed_builder } = require("../../utils/embeds.js")
const { groupId, dd_role_id, instructor_role_id } = require("../../configs/config.json")

module.exports = {
    description: "Returns a list of the strikes in FGA.",
    async execute(interaction){
        const client = interaction.client
        const strikesPerPage = 5; // Number of strikes per page
        let currentPage = 0; 
        if(interaction.member.roles.highest.position <  interaction.guild.roles.cache.get(instructor_role_id).position){
            return interaction.editReply("You do not have permission to use this command.")
        }
        const strikes = await StrikeDB.find({}).sort({ started_on: -1 })
        if(strikes.length === 0){
            const embed = embed_builder("Strikes", "No strikes were found.", "#aa0707").setTimestamp()
            return interaction.editReply({ embeds: [embed] });   
        }
        const generateEmbed = (page) => {
            const start = page * strikesPerPage;
            const end = start + strikesPerPage;
            const currentStrikes = strikes.slice(start, end);

            const embed = embed_builder('strikes', 'List of strikes (5 per page)', "#b60303")
                .setFooter({ text: `Page ${page + 1} of ${Math.ceil(strikes.length / strikesPerPage)}` });

            currentStrikes.forEach((strike, index) => {
                embed.addFields({
                    name: `Strike ${start + index + 1}`,
                    value: `User: <@${strike.striked_id}>\nMade by:<@${strike.striker_id}>\nReason: ${strike.reason || 'No reason provided'}`,
                });
            });

            return embed;
        };

        // Function to generate buttons for pagination
        const generateButtons = (page) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0), // Disable "Previous" on the first page
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled((page + 1) * strikesPerPage >= strikes.length) // Disable "Next" on the last page
            );

            return row;
        };

        // Send the initial embed and buttons
        const embed = generateEmbed(currentPage);
        const buttons = generateButtons(currentPage);
        const message = await interaction.editReply({ embeds: [embed], components: [buttons], fetchReply: true });

        // Create a button interaction collector
        const collector = message.createMessageComponentCollector({ time: 120000 }); // 60 seconds timeout

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.customId === 'previous') {
                currentPage--;
            } else if (buttonInteraction.customId === 'next') {
                currentPage++;
            }

            // Update the embed and buttons
            const updatedEmbed = generateEmbed(currentPage);
            const updatedButtons = generateButtons(currentPage);
            await buttonInteraction.update({ embeds: [updatedEmbed], components: [updatedButtons] });
        });

        collector.on('end', () => {
            // Disable buttons when the collector ends
            const disabledButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            );

            interaction.editReply({ components: [disabledButtons] });
        });
    },
};