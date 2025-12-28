import {type ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import {objectif} from '../lang';
import {getObjectiveModal} from '../modals';
import {getDailyGoal, getWeeklyGoal} from '../storage';

export const commandName = 'objectif';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(objectif.command.description)
  .addUserOption(o => o.setName('utilisateur').setDescription(objectif.command.optionUtilisateurDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
  const optUser = interaction.options.getUser('utilisateur');

  if (optUser) {
    const [dailyGoal, weeklyGoal] = await Promise.all([getDailyGoal(optUser.id), getWeeklyGoal(optUser.id)]);
    if (dailyGoal === null && weeklyGoal === null) {
      return interaction.reply({content: objectif.replySelect.noGoal(optUser.id)});
    }
    return interaction.reply({content: objectif.replySelect.goals(optUser.id, dailyGoal, weeklyGoal)});
  }

  const modal = await getObjectiveModal(interaction.user.id);
  return await interaction.showModal(modal);
}

export default {commandName, data, execute};
