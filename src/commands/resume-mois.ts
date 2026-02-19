import {AttachmentBuilder, type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder} from 'discord.js';
import DateTime from '../date-time';
import {renderMonthlySummaryImage} from '../image/monthly-summary';
import {resumeMois as resumeLang} from '../lang';
import {getDataForMonthlySummary} from '../storage';

export const commandName = 'resume-mois';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(resumeLang.command.description)
  .addStringOption(o => o.setName('mois').setDescription(resumeLang.command.optionMoisDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
  const dateOpt = interaction.options.getString('mois');
  const date = dateOpt ? DateTime.parse(dateOpt) : DateTime.now();
  if (date === null) return interaction.reply({content: resumeLang.replyAction.invalidDate, flags: MessageFlags.Ephemeral});

  const firstDayOfMonth = date.firstDayOfMonth();

  const img = await renderMonthlySummaryImage(await getDataForMonthlySummary(interaction.user, firstDayOfMonth));

  return interaction.reply({
    content: resumeLang.replyAction.message(interaction.user.id, firstDayOfMonth),
    files: [new AttachmentBuilder(img, {name: `monthly-${interaction.user.id}-${firstDayOfMonth.toDateString()}.png`})]
  });
}

export default {commandName, data, execute};
