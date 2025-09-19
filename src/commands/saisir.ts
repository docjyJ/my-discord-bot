import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {getEntry, getGoal, setEntry} from '../steps/storage';
import { saisir } from '../lang';

dayjs.extend(utc);
dayjs.extend(timezone);

export const commandName = 'saisir';

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription(saisir.command.description)
	.addStringOption(o => o.setName('jour')
		.setDescription(saisir.command.optionJourDescription)
		.setRequired(false)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const jour = interaction.options.getString('jour') || dayjs().tz('Europe/Paris').format('YYYY-MM-DD');
	const modal = await getModale(jour, interaction.user.id);
	await interaction.showModal(modal);
}

export async function getModale(date: string, userId?: string) {
	const modal = new ModalBuilder()
		.setCustomId(`${saisir.ids.modalPrefix}${date}`)
		.setTitle(saisir.modal.title(date));

	const pasInput = new TextInputBuilder()
		.setCustomId('pas')
		.setLabel(saisir.modal.stepLabel)
		.setPlaceholder(saisir.modal.stepPlaceholder)
		.setStyle(TextInputStyle.Short)
		.setRequired(false);

	if (userId) {
		const { steps: existing } = await getEntry(userId, date);
		if (existing !== undefined && existing !== null) {
			pasInput.setValue(String(existing));
		}
	}

	modal.addComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(pasInput),
	);

	return modal;
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
	if (!interaction.customId.startsWith(saisir.ids.modalPrefix)) return;

	const dateISO = interaction.customId.substring(saisir.ids.modalPrefix.length);
	const date = dayjs.tz(dateISO, 'Europe/Paris');
	if (!date.isValid()) {
		return interaction.reply({content: saisir.replyAction.invalidDate, flags: MessageFlags.Ephemeral});
	}

	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();
	const userId = interaction.user.id;

	if (rawStr === '') {
		const {steps: oldValue} = await getEntry(userId, dateISO);
		await setEntry(userId, dateISO, {steps: null});
		if (oldValue === null) {
			return interaction.reply({
				content: saisir.replyAction.noEntryToDelete(dateISO),
				flags: MessageFlags.Ephemeral
			});
		} else {
			return interaction.reply({
				content: saisir.replyAction.entryDeleted(userId, dateISO, oldValue),
			});
		}
	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: saisir.replyAction.invalidValue, flags: MessageFlags.Ephemeral});
	}

	const {steps: oldValue} = await getEntry(userId, dateISO);
	await setEntry(userId, dateISO, {steps: raw});
	const {stepsGoal} = await getGoal(userId); // en pas bruts
	let msg = saisir.replyAction.saved(raw, dateISO);
	if (stepsGoal && stepsGoal > 0) {
		if (raw >= stepsGoal) {
			msg += saisir.replyAction.goalReached(stepsGoal);
		} else {
			const reste = stepsGoal - raw;
			const resteApprox = Math.round(reste / 1000) * 1000;
			msg += saisir.replyAction.goalRemaining(stepsGoal, resteApprox);
		}
	}
	if (oldValue !== null && oldValue !== stepsGoal) {
		msg += saisir.replyAction.previousValue(oldValue as number);
	}
	return interaction.reply({content: msg, flags: MessageFlags.Ephemeral});
}

export default {commandName, data, execute};
