import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import {saisir} from '../lang';
import DateTime from "../date-time";
import {getSaisirModal} from "../modals";


export const commandName = 'saisir';

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription(saisir.command.description)
	.addStringOption(o => o.setName('jour')
		.setDescription(saisir.command.optionJourDescription)
		.setRequired(false)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const jour = interaction.options.getString('jour') || DateTime.now().toISO();
	const modal = await getSaisirModal(jour, interaction.user.id);
	return await interaction.showModal(modal);
}


export default {commandName, data, execute};
