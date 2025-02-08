const { retry, getUserRankIndex, noblox, parseDuration, makedurationbigger, logerror, chnlsend} = require("../../utils/utils.js")
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const { User } = require("../../utils/mongodb.js")
const { embed_builder } = require("../../utils/embeds.js")
const { groupId, dd_role_id, instructor_role_id } = require("../../configs/config.json")

module.exports = {
    description: "Returns a list of the suspension in FGA.",
    async execute(interaction){
        const client = interaction.client
        const suspensionsPerPage = 5; // Number of suspensions per page
        let currentPage = 0; 
        if(interaction.member.roles.highest.position <  interaction.guild.roles.cache.get(instructor_role_id).position){
            return interaction.editReply("You do not have permission to use this command.")
        }
        const suspensions = await User.find({}).sort({ started_on: -1 })
        if(suspensions.length === 0){
            const embed = embed_builder("Suspensions", "No suspensions were found.", "#aa0707").setTimestamp()
            return interaction.editReply({ embeds: [embed] });   
        }
        const generateEmbed = (page) => {
            const start = page * suspensionsPerPage;
            const end = start + suspensionsPerPage;
            const currentSuspensions = suspensions.slice(start, end);

            const embed = embed_builder('Suspensions', 'List of suspensions (5 per page)', "#b60303")
                .setFooter({ text: `Page ${page + 1} of ${Math.ceil(suspensions.length / suspensionsPerPage)}` });

            currentSuspensions.forEach((suspension, index) => {
                embed.addFields({
                    name: `Suspension ${start + index + 1}`,
                    value: `User: <@${suspension.discordId}>\nMade by: <@${suspension.suspender_id}>\nReason: ${suspension.reason || 'No reason provided'}`,
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
                    .setDisabled((page + 1) * suspensionsPerPage >= suspensions.length) // Disable "Next" on the last page
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