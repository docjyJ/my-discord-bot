import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DateTime } from 'luxon';
import { recordSteps, getGoal, getEntry } from '../steps/storage';

export const commandName = 'pas';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription('Enregistrer les pas du jour (en milliers).')
  .addIntegerOption(o => o.setName('milliers')
    .setDescription('Nombre de milliers de pas (ex: 8 pour 8000)')
    .setRequired(true)
    .setMinValue(0)
  )
  .addStringOption(o => o.setName('date')
    .setDescription('Date AAAA-MM-JJ (optionnel, défaut: aujourd\'hui Europe/Paris)')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const milliers = interaction.options.getInteger('milliers', true); // requis
  const dateOpt = interaction.options.getString('date') || undefined;
  const date = dateOpt ? DateTime.fromISO(dateOpt, { zone: 'Europe/Paris' }) : DateTime.now().setZone('Europe/Paris');
  if (!date.isValid) {
    return interaction.reply({ content: 'Date invalide. Format attendu AAAA-MM-JJ.', ephemeral: true });
  }
  const dateISO = date.toISODate() || date.toFormat('yyyy-MM-dd');
  const userId = interaction.user.id;

  const oldValue = await getEntry(userId, dateISO);
  await recordSteps(userId, dateISO, milliers);
  const goal = await getGoal(userId);

  let msg = `Enregistré: ${milliers * 1000} pas pour ${dateISO}.`;
  if (goal && milliers >= goal) {
    msg += ` Objectif atteint ✅ (${goal * 1000}).`;
  } else if (goal) {
    const reste = Math.max(goal - milliers, 0) * 1000;
    msg += ` Objectif: ${goal * 1000} (reste ${reste}).`;
  }
  if (oldValue !== undefined && oldValue !== milliers) {
    msg += ` (Mise à jour, ancien: ${oldValue * 1000})`;
  }
  return interaction.reply({ content: msg, ephemeral: true });
}

export default { commandName, data, execute };