import { ChatInputCommandInteraction, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, ModalSubmitInteraction } from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { recordSteps, getGoal, getEntry } from '../steps/storage';

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
  const modal = getModale(jour);
  await interaction.showModal(modal);
}

export function getModale(jour?: string) {
  const date = jour || dayjs().tz('Europe/Paris').format('YYYY-MM-DD');
  const modal = new ModalBuilder()
    .setCustomId(`saisir-modal-${date}`)
    .setTitle('Saisir les pas (arrondi)');

  const pasInput = new TextInputBuilder()
    .setCustomId('pas')
    .setLabel('Nombre de pas (~, ex: 7800 ou 8 pour 8000)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const jourInput = new TextInputBuilder()
    .setCustomId('jour')
    .setLabel('Jour (AAAA-MM-JJ)')
    .setStyle(TextInputStyle.Short)
    .setValue(date)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(pasInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(jourInput)
  );

  return modal;
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  if (!interaction.customId.startsWith('saisir-modal')) return;
  const rawStr = interaction.fields.getTextInputValue('pas').trim();
  const jour = interaction.fields.getTextInputValue('jour') || dayjs().tz('Europe/Paris').format('YYYY-MM-DD');
  const raw = parseInt(rawStr, 10);
  if (isNaN(raw) || raw < 0) {
    return interaction.reply({ content: 'Valeur invalide.', flags: MessageFlags.Ephemeral });
  }
  // Si < 50 on suppose que c'est un nombre de milliers entré (ex: 8 => 8000)
  let interpreted = raw < 50 ? raw * 1000 : raw;
  const roundedSteps = Math.round(interpreted / 1000) * 1000; // arrondi au millier

  const date = dayjs.tz(jour, 'Europe/Paris');
  if (!date.isValid()) {
    return interaction.reply({ content: 'Date invalide. Format attendu AAAA-MM-JJ.', flags: MessageFlags.Ephemeral });
  }
  const dateISO = date.format('YYYY-MM-DD');
  const userId = interaction.user.id;
  const oldValue = await getEntry(userId, dateISO); // en pas bruts
  await recordSteps(userId, dateISO, roundedSteps);
  const goal = await getGoal(userId); // en pas bruts
  let msg = `Enregistré: environ ${roundedSteps} pas pour ${dateISO}.`;
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
  return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
}

export default { commandName, data, execute, handleModalSubmit, getModale };
