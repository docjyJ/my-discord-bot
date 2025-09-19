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

export const commandName = 'objectif';

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription("Afficher ou définir un objectif quotidien (en pas, arrondi au millier)")
	.addUserOption(o => o.setName('utilisateur')
		.setDescription('Utilisateur cible (défaut: toi)')
	);

function roundTo1000(v: number) {
	return Math.round(v / 1000) * 1000;
}

export async function execute(interaction: ChatInputCommandInteraction) {
	const utilisateurOpt = interaction.options.getUser('utilisateur');
	const targetUser: User = utilisateurOpt || interaction.user;

	// Si l'option utilisateur est renseignée, on affiche l'objectif de cet utilisateur
	if (utilisateurOpt) {
		const goal = await getGoal(targetUser.id);
		if (!goal || goal === 0) {
			return interaction.reply({content: `<@${targetUser.id}> n'a pas d'objectif`});
		}
		return interaction.reply({content: `l'objectif de <@${targetUser.id}> est d'environ ${goal} pas / jour`});
	}

	// Sinon, ouvrir un modal pour saisir son propre objectif
	const modal = await getModale(interaction.user.id);
	await interaction.showModal(modal);
}

export async function getModale(userId: string) {
	const current = await getGoal(userId);
	const modal = new ModalBuilder()
		.setCustomId('objectif-modal')
		.setTitle('Définir mon objectif de pas par jour');

	const input = new TextInputBuilder()
		.setCustomId('pas')
		.setLabel('Objectif')
		.setPlaceholder('8000')
		.setStyle(TextInputStyle.Short)
		.setRequired(false);


	if (current && current > 0) {
		input.setValue(String(current));
	}

	modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
	return modal;
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
	if (interaction.customId !== 'objectif-modal') return;
	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();

	// Vide => suppression de l'objectif
	if (rawStr === '') {
		await setGoal(interaction.user.id, 0);
		return interaction.reply({
			content: `l'objectif de <@${interaction.user.id}> a été supprimé`,
			flags: MessageFlags.Ephemeral
		});
	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: 'valeur invalide: doit être un entier >= 0.', flags: MessageFlags.Ephemeral});
	}
	const arrondi = roundTo1000(raw);
	await setGoal(interaction.user.id, arrondi);
	return interaction.reply({
		content: `le nouvel objectif de <@${interaction.user.id}> est d'environ ${arrondi} pas / jour (arrondi)`,
		flags: MessageFlags.Ephemeral
	});
}

export default {commandName, data, execute, handleModalSubmit, getModale};
