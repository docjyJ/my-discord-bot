import {ActionRowBuilder, MessageFlags, ModalBuilder, type ModalSubmitInteraction, TextInputBuilder, TextInputStyle} from 'discord.js';
import {objectif} from '../lang';
import {db} from '../storage';

export const modalId = 'objectif';

async function getModal(userId: string) {
  const [currentDaily, currentWeekly] = await Promise.all([db.getDailyGoal(userId), db.getWeeklyGoal(userId)]);
  const modal = new ModalBuilder().setCustomId(modalId).setTitle(objectif.modal.title);

  const dailyInput = new TextInputBuilder().setCustomId('pas_jour').setLabel(objectif.modal.stepLabel).setPlaceholder(objectif.modal.stepPlaceholder).setStyle(TextInputStyle.Short).setRequired(false);

  if (currentDaily !== null) {
    dailyInput.setValue(String(currentDaily));
  }

  const weeklyInput = new TextInputBuilder()
    .setCustomId('pas_semaine')
    .setLabel(objectif.modal.weeklyStepLabel)
    .setPlaceholder(objectif.modal.weeklyStepPlaceholder)
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  if (currentWeekly !== null) {
    weeklyInput.setValue(String(currentWeekly));
  }

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(dailyInput), new ActionRowBuilder<TextInputBuilder>().addComponents(weeklyInput));
  return modal;
}

async function executor(interaction: ModalSubmitInteraction) {
  const rawDailyStr = (interaction.fields.getTextInputValue('pas_jour') ?? '').trim();
  const rawWeeklyStr = (interaction.fields.getTextInputValue('pas_semaine') ?? '').trim();

  const [currentDaily, currentWeekly] = await Promise.all([db.getDailyGoal(interaction.user.id), db.getWeeklyGoal(interaction.user.id)]);

  let changed = false;
  const messages: string[] = [];

  // Daily
  if (rawDailyStr === '') {
    if (currentDaily !== null) {
      await db.setDailyGoal(interaction.user.id, null);
      changed = true;
      messages.push(objectif.replyAction.noDailyGoal(interaction.user.id));
    }
  } else {
    const raw = parseInt(rawDailyStr, 10);
    if (Number.isNaN(raw) || raw < 0) {
      return interaction.reply({content: objectif.replyAction.invalidValue, flags: MessageFlags.Ephemeral});
    }
    if (raw !== currentDaily) {
      await db.setDailyGoal(interaction.user.id, raw);
      changed = true;
      messages.push(objectif.replyAction.dailyGoal(interaction.user.id, raw));
    }
  }

  // Weekly
  if (rawWeeklyStr === '') {
    if (currentWeekly !== null) {
      await db.setWeeklyGoal(interaction.user.id, null);
      changed = true;
      messages.push(objectif.replyAction.noWeeklyGoal(interaction.user.id));
    }
  } else {
    const raw = parseInt(rawWeeklyStr, 10);
    if (Number.isNaN(raw) || raw < 0) {
      return interaction.reply({content: objectif.replyAction.invalidValue, flags: MessageFlags.Ephemeral});
    }
    if (raw !== currentWeekly) {
      await db.setWeeklyGoal(interaction.user.id, raw);
      changed = true;
      messages.push(objectif.replyAction.weeklyGoal(interaction.user.id, raw));
    }
  }

  if (!changed) {
    return interaction.reply({content: objectif.replyAction.noChange, flags: MessageFlags.Ephemeral});
  }

  return interaction.reply({content: messages.join('\n')});
}

export default {modalId, getModal, executor};
