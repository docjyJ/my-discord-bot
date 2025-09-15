import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { setGoal, getGoal } from '../steps/storage';

export const commandName = 'objectif';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription('Définir ou afficher ton objectif quotidien (en milliers de pas)')
  .addIntegerOption(o => o.setName('milliers')
    .setDescription('Nombre de milliers de pas (ex: 8 pour 8000)')
    .setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const milliers = interaction.options.getInteger('milliers'); // optionnel
  const userId = interaction.user.id;
  if (milliers !== null) {
    await setGoal(userId, milliers);
    return interaction.reply({ content: `Objectif enregistré: ${milliers * 1000} pas / jour.`, ephemeral: true });
  }
  const goal = await getGoal(userId);
  if (goal === undefined || goal === 0) {
    return interaction.reply({ content: 'Aucun objectif encore défini. Utilise /objectif milliers:<n>.', ephemeral: true });
  }
  return interaction.reply({ content: `Ton objectif actuel: ${goal * 1000} pas / jour.`, ephemeral: true });
}

export default { commandName, data, execute };