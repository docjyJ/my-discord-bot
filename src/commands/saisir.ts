import {
	ActionRowBuilder,
	AttachmentBuilder,
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
import {getEntry, getGoal, getStreak, setEntry} from '../steps/storage';
import {saisir} from '../lang';
import {renderPresentationImage} from '../image/renderer';

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

async function buildAttachmentFor(interaction: ModalSubmitInteraction, dateISO: string, steps: number) {
	const {stepsGoal} = await getGoal(interaction.user.id);
	const streak = await getStreak(interaction.user.id, dateISO);
	const avatarUrl = interaction.user.displayAvatarURL({extension: 'png', size: 512});
	const img = await renderPresentationImage({
		username: `@${interaction.user.username}`,
		avatarUrl,
		dateISO,
		steps,
		goal: stepsGoal,
		streak,
	});
	return new AttachmentBuilder(img, {name: `progress-${interaction.user.id}-${dateISO}.png`});
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
	if (!interaction.customId.startsWith(saisir.ids.modalPrefix)) return;

	const dateISO = interaction.customId.substring(saisir.ids.modalPrefix.length);
	const date = dayjs.tz(dateISO, 'Europe/Paris');
	if (!date.isValid()) {
		return interaction.reply({content: saisir.replyAction.invalidDate, flags: MessageFlags.Ephemeral});
	}

	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();
	const {steps} = await getEntry(interaction.user.id, dateISO);

	if (rawStr === '') {
		if (steps === null) {
			return interaction.reply({
				content: saisir.replyAction.noChange(dateISO),
				flags: MessageFlags.Ephemeral
			});
		}
		await setEntry(interaction.user.id, dateISO, {steps: null});
		return interaction.reply({
			content: saisir.replyAction.entryDeleted(interaction.user.id, dateISO),
		});

	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: saisir.replyAction.invalidValue, flags: MessageFlags.Ephemeral});
	}

	if (steps === raw) {
		return interaction.reply({
			content: saisir.replyAction.noChange(dateISO),
			flags: MessageFlags.Ephemeral
		});
	}

	await setEntry(interaction.user.id, dateISO, {steps: raw});

	return interaction.reply({
		content: saisir.replyAction.saved(interaction.user.id, dateISO),
		files: [await buildAttachmentFor(interaction, dateISO, raw)]
	});
}

export default {commandName, data, execute};
