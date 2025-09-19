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

dayjs.extend(utc);
dayjs.extend(timezone);

export const commandName = 'saisir';

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription('Saisir les pas du jour via un formulaire.')
	.addStringOption(o => o.setName('jour')
		.setDescription('Date AAAA-MM-JJ (optionnel, défaut: aujourd\'hui Europe/Paris)')
		.setRequired(false)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const jour = interaction.options.getString('jour') || dayjs().tz('Europe/Paris').format('YYYY-MM-DD');
	const modal = await getModale(jour, interaction.user.id);
	await interaction.showModal(modal);
}

export async function getModale(date: string, userId?: string) {
	const modal = new ModalBuilder()
		.setCustomId(`saisir-modal-${date}`)
		.setTitle(`Saisir les pas pour ${date}`);

	const pasInput = new TextInputBuilder()
		.setCustomId('pas')
		.setLabel('Nombre de pas')
		.setPlaceholder('7800')
		.setStyle(TextInputStyle.Short)
		.setRequired(false);

	if (userId) {
		const existing = await getEntry(userId, date);
		if (existing !== undefined) {
			pasInput.setValue(String(existing));
		}
	}

	modal.addComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(pasInput),
	);

	return modal;
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
	if (!interaction.customId.startsWith('saisir-modal-')) return;

	const dateISO = interaction.customId.substring('saisir-modal-'.length);
	const date = dayjs.tz(dateISO, 'Europe/Paris');
	if (!date.isValid()) {
		return interaction.reply({content: 'Date invalide. Format attendu AAAA-MM-JJ.', flags: MessageFlags.Ephemeral});
	}

	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();
	const userId = interaction.user.id;

	if (rawStr === '') {
		const {steps: oldValue} = await getEntry(userId, dateISO);
		await setEntry(userId, dateISO, {steps: null});
		if (oldValue === null) {
			return interaction.reply({
				content: `Aucune saisie pour ${dateISO} — rien à supprimer.`,
				flags: MessageFlags.Ephemeral
			});
		} else {
			return interaction.reply({
				content: `<@${userId}> a supprimé la saisie du ${dateISO} (ancien: ${oldValue} pas).`,
			});
		}
	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: 'Valeur invalide: entrer un entier >= 0.', flags: MessageFlags.Ephemeral});
	}

	const {steps: oldValue} = await getEntry(userId, dateISO);
	await setEntry(userId, dateISO, {steps: raw});
	const {stepsGoal} = await getGoal(userId); // en pas bruts
	let msg = `Enregistré: ${raw} pas pour ${dateISO} (arrondi à la centaine inférieure).`;
	if (stepsGoal && stepsGoal > 0) {
		if (raw >= stepsGoal) {
			msg += ` Objectif (~${stepsGoal} pas) atteint ✅.`;
		} else {
			const reste = stepsGoal - raw;
			const resteApprox = Math.round(reste / 1000) * 1000;
			msg += ` Objectif ${stepsGoal} pas (reste ${resteApprox}).`;
		}
	}
	if (oldValue !== null && oldValue !== stepsGoal) {
		msg += ` (Ancien:  ${oldValue} pas)`;
	}
	return interaction.reply({content: msg, flags: MessageFlags.Ephemeral});
}

export default {commandName, data, execute};
