import {getGoal, setGoal} from "../steps/storage";
import {
	ActionRowBuilder,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import {objectif} from "../lang";


export const modalId = 'objectif';

async function getModal(userId: string) {
	const {stepsGoal: current} = await getGoal(userId);
	const modal = new ModalBuilder()
		.setCustomId(modalId)
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

async function executor(interaction: ModalSubmitInteraction) {
	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();
	const {stepsGoal} = await getGoal(interaction.user.id);

	if (rawStr === '') {
		if (stepsGoal === null) {
			return interaction.reply({
				content: objectif.replyAction.noChange,
				flags: MessageFlags.Ephemeral
			});
		}
		await setGoal(interaction.user.id, {stepsGoal: null});
		return interaction.reply({
			content: objectif.replyAction.noGoal(interaction.user.id),
		});
	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: objectif.replyAction.invalidValue, flags: MessageFlags.Ephemeral});
	}
	if (stepsGoal === raw) {
		return interaction.reply({
			content: objectif.replyAction.noChange,
			flags: MessageFlags.Ephemeral
		});
	}
	await setGoal(interaction.user.id, {stepsGoal: raw});
	return interaction.reply({
		content: objectif.replyAction.goal(interaction.user.id, raw)
	});
}

export default {modalId, getModal, executor};
