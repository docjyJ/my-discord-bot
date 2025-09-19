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
import {getEntry, getGoal, recordSteps, removeEntry} from '../steps/storage';

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

export async function getModale(jour?: string, userId?: string) {
	const date = jour || dayjs().tz('Europe/Paris').format('YYYY-MM-DD');
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

	// Si vide: supprimer l'entrée
	if (rawStr === '') {
		const oldValue = await getEntry(userId, dateISO);
		await removeEntry(userId, dateISO);
		const msg = oldValue !== undefined
			? `Saisie supprimée pour ${dateISO} (ancien: ≈ ${oldValue} pas).`
			: `Aucune saisie pour ${dateISO} — rien à supprimer.`;
		return interaction.reply({content: msg, flags: MessageFlags.Ephemeral});
	}

	// Sinon: valider et arrondir à la centaine inférieure
	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: 'Valeur invalide: entrer un entier >= 0.', flags: MessageFlags.Ephemeral});
	}
	const roundedSteps = Math.floor(raw / 100) * 100; // arrondi à la centaine inférieure

	const oldValue = await getEntry(userId, dateISO); // en pas bruts
	await recordSteps(userId, dateISO, roundedSteps);
	const goal = await getGoal(userId); // en pas bruts
	let msg = `Enregistré: ≈ ${roundedSteps} pas pour ${dateISO} (arrondi à la centaine inférieure).`;
	if (goal && goal > 0) {
		if (roundedSteps >= goal) {
			msg += ` Objectif (~${goal} pas) atteint ✅.`;
		} else {
			const reste = goal - roundedSteps;
			const resteApprox = Math.round(reste / 1000) * 1000;
			msg += ` Objectif ≈ ${goal} pas (reste ≈ ${resteApprox}).`;
		}
	}
	if (oldValue !== undefined && oldValue !== roundedSteps) {
		msg += ` (Ancien: ≈ ${oldValue} pas)`;
	}
	return interaction.reply({content: msg, flags: MessageFlags.Ephemeral});
}

export default {commandName, data, execute, handleModalSubmit, getModale};
