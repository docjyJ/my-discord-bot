import {
	ActionRowBuilder,
	AttachmentBuilder,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import {saisir} from "../lang";
import {getEntry, getGoal, getStreak, setEntry} from "../storage";
import {renderPresentationImage} from "../image/renderer";
import DateTime from "../date-time";


const modalId = 'saisir'

async function getModal(date: DateTime, userId?: string) {
	const modal = new ModalBuilder()
		.setCustomId(`${modalId}/${date.toDateString()}`)
		.setTitle(saisir.modal.title(date));

	const pasInput = new TextInputBuilder()
		.setCustomId('pas')
		.setLabel(saisir.modal.stepLabel)
		.setPlaceholder(saisir.modal.stepPlaceholder)
		.setStyle(TextInputStyle.Short)
		.setRequired(false);

	if (userId) {
		const {steps: existing} = await getEntry(userId, date);
		if (existing !== undefined && existing !== null) {
			pasInput.setValue(String(existing));
		}
	}

	modal.addComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(pasInput),
	);

	return modal;
}

async function buildAttachmentFor(interaction: ModalSubmitInteraction, date: DateTime, steps: number) {
	const {stepsGoal} = await getGoal(interaction.user.id);
	const streak = await getStreak(interaction.user.id, date);
	const avatarUrl = interaction.user.displayAvatarURL({extension: 'png', size: 512});
	const img = await renderPresentationImage({
		username: `@${interaction.user.username}`,
		avatarUrl,
		date,
		steps,
		goal: stepsGoal,
		streak,
	});
	return new AttachmentBuilder(img, {name: `progress-${interaction.user.id}-${date.toDateString()}.png`});
}

async function executor(interaction: ModalSubmitInteraction, [dateISO]: string[]) {

	const date = DateTime.parse(dateISO);
	if (date === null) {
		return interaction.reply({content: saisir.replyAction.invalidDate, flags: MessageFlags.Ephemeral});
	}

	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();
	const {steps} = await getEntry(interaction.user.id, date);

	if (rawStr === '') {
		if (steps === null) {
			return interaction.reply({
				content: saisir.replyAction.noChange(date),
				flags: MessageFlags.Ephemeral
			});
		}
		await setEntry(interaction.user.id, date, {steps: null});
		return interaction.reply({
			content: saisir.replyAction.entryDeleted(interaction.user.id, date),
		});

	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: saisir.replyAction.invalidValue, flags: MessageFlags.Ephemeral});
	}

	if (steps === raw) {
		return interaction.reply({
			content: saisir.replyAction.noChange(date),
			flags: MessageFlags.Ephemeral
		});
	}

	await setEntry(interaction.user.id, date, {steps: raw});

	return interaction.reply({
		content: saisir.replyAction.saved(interaction.user.id, date),
		files: [await buildAttachmentFor(interaction, date, raw)]
	});
}

export default {modalId, getModal, executor};
