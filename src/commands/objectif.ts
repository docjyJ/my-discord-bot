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

export async function execute(interaction: ChatInputCommandInteraction) {
	const utilisateurOpt = interaction.options.getUser('utilisateur');
	const targetUser: User = utilisateurOpt || interaction.user;

	if (utilisateurOpt) {
		const {stepsGoal} = await getGoal(targetUser.id);
		if (stepsGoal === null) {
			return interaction.reply({content: `<@${targetUser.id}> n'a pas d'objectif`});
		}
		return interaction.reply({content: `l'objectif de <@${targetUser.id}> est de ${stepsGoal} pas / jour`});
	}

	const modal = await getModale(interaction.user.id);
	await interaction.showModal(modal);
}

export async function getModale(userId: string) {
	const {stepsGoal: current} = await getGoal(userId);
	const modal = new ModalBuilder()
		.setCustomId('objectif-modal')
		.setTitle('Définir mes objectifs journaliers');

	const input = new TextInputBuilder()
		.setCustomId('pas')
		.setLabel('Objectif de pas par jour')
		.setPlaceholder('8000')
		.setStyle(TextInputStyle.Short)
		.setRequired(false);


	if (current !== null) {
		input.setValue(String(current));
	}

	modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
	return modal;
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
	if (interaction.customId !== 'objectif-modal') return;
	const rawStr = (interaction.fields.getTextInputValue('pas') ?? '').trim();

	if (rawStr === '') {
		await setGoal(interaction.user.id, {stepsGoal: null});
		return interaction.reply({
			content: `l'objectif de <@${interaction.user.id}> a été supprimé`,
		});
	}

	const raw = parseInt(rawStr, 10);
	if (isNaN(raw) || raw < 0) {
		return interaction.reply({content: 'valeur invalide: doit être un entier >= 0.', flags: MessageFlags.Ephemeral});
	}
	await setGoal(interaction.user.id, {stepsGoal: raw});
	return interaction.reply({
		content: `le nouvel objectif de <@${interaction.user.id}> est de ${raw} pas par jour`
	});
}

export default {commandName, data, execute};
