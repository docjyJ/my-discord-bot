import {type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder} from 'discord.js';
import DateTime from '../date-time';
import {saisir} from '../lang';
import {getSaisirModal} from '../modals';

export const commandName = 'saisir';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(saisir.command.description)
  .addStringOption(o => o.setName('jour').setDescription(saisir.command.optionJourDescription).setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  const dateOpt = interaction.options.getString('jour');
  const date = dateOpt ? DateTime.parse(dateOpt) : DateTime.now();
  if (!date) return await interaction.reply({content: saisir.replyAction.invalidDate, flags: MessageFlags.Ephemeral});
  const modal = await getSaisirModal(date, interaction.user.id);
  return await interaction.showModal(modal);
}

export default {commandName, data, execute};
