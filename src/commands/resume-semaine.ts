import {AttachmentBuilder, type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder} from 'discord.js';
import DateTime from '../date-time';
import {renderWeeklySummaryImage} from '../image/renderer';
import {resumeSemaine as resumeLang} from '../lang';
import {getDataForWeeklySummary} from '../storage';

export const commandName = 'resume-semaine';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(resumeLang.command.description)
  .addStringOption(o => o.setName('lundi').setDescription(resumeLang.command.optionLundiDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
  const dateOpt = interaction.options.getString('lundi');
  const date = dateOpt ? DateTime.parse(dateOpt) : DateTime.now();
  if (date === null) return interaction.reply({content: resumeLang.replyAction.invalidMonday, flags: MessageFlags.Ephemeral});
  const monday = date.getMonday();

  const img = await renderWeeklySummaryImage(await getDataForWeeklySummary(interaction.user, monday));

  return interaction.reply({
    content: resumeLang.replyAction.message(interaction.user.id, monday),
    files: [new AttachmentBuilder(img, {name: `weekly-${interaction.user.id}-${monday.toDateString()}.png`})]
  });
}

export default {commandName, data, execute};
