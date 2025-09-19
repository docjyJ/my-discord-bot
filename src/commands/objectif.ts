import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
	User
} from 'discord.js';
import {getGoal, setGoal} from '../steps/storage';
import { objectif } from '../lang';

export const commandName = 'objectif';

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription(objectif.command.description)
	.addUserOption(o => o.setName('utilisateur')
		.setDescription(objectif.command.optionUtilisateurDescription)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const utilisateurOpt = interaction.options.getUser('utilisateur');
	const targetUser: User = utilisateurOpt || interaction.user;

	if (utilisateurOpt) {
		const {stepsGoal} = await getGoal(targetUser.id);
		if (stepsGoal === null) {
			return interaction.reply({content: objectif.replySelect.noGoal(targetUser.id)});
		}
		return interaction.reply({content: objectif.replySelect.goal(targetUser.id, stepsGoal)});
	}

	const modal = await getModale(interaction.user.id);
	await interaction.showModal(modal);
}

export async function getModale(userId: string) {
	const {stepsGoal: current} = await getGoal(userId);
	const modal = new ModalBuilder()
		.setCustomId(objectif.ids.modalId)
		.setTitle(objectif.modal.title);

	const input = new TextInputBuilder()
		.setCustomId('pas')
		.setLabel(objectif.modal.stepLabel)
		.setPlaceholder(objectif.modal.stepPlaceholder)
		.setStyle(TextInputStyle.Short)
		.setRequired(false);


	if (current !== null) {
		input.setValue(String(current));
	}

	modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
	return modal;
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
	if (interaction.customId !== objectif.ids.modalId) return;
	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();

	if (rawStr === '') {
		await setGoal(interaction.user.id, {stepsGoal: null});
		return interaction.reply({
			content: objectif.replyAction.noGoal(interaction.user.id),
		});
	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: objectif.replyAction.invalidValue, flags: MessageFlags.Ephemeral});
	}
	await setGoal(interaction.user.id, {stepsGoal: raw});
	return interaction.reply({
		content: objectif.replyAction.goal(interaction.user.id, raw)
	});
}

export default {commandName, data, execute};
