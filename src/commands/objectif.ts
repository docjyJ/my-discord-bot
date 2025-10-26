import {type ChatInputCommandInteraction, SlashCommandBuilder, type User} from 'discord.js';
import {objectif} from '../lang';
import {getObjectiveModal} from '../modals';
import {getGoal} from '../storage';

export const commandName = 'objectif';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(objectif.command.description)
  .addUserOption(o => o.setName('utilisateur').setDescription(objectif.command.optionUtilisateurDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
  const utilisateurOpt = interaction.options.getUser('utilisateur');
  const targetUser: User = utilisateurOpt || interaction.user;

  if (utilisateurOpt) {
    const stepsGoal = await getGoal(targetUser.id);
    if (stepsGoal === null) {
      return interaction.reply({content: objectif.replySelect.noGoal(targetUser.id)});
    }
    return interaction.reply({content: objectif.replySelect.goal(targetUser.id, stepsGoal)});
  }

  const modal = await getObjectiveModal(interaction.user.id);
  return await interaction.showModal(modal);
}

export default {commandName, data, execute};
