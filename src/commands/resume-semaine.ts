import {AttachmentBuilder, type ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import DateTime from '../date-time';
import {renderWeeklySummaryImage} from '../image/renderer';
import {resumeSemaine as resumeLang} from '../lang';
import db, {getWeekSummary} from '../storage';

export const commandName = 'resume-semaine';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(resumeLang.command.description)
  .addStringOption(o => o.setName('lundi').setDescription(resumeLang.command.optionLundiDescription));

export async function execute(interaction: ChatInputCommandInteraction) {
  const lundiOpt = interaction.options.getString('lundi');
  const date = lundiOpt ? DateTime.parse(lundiOpt) : DateTime.now();
  if (date === null) return interaction.reply({content: resumeLang.replyAction.invalidMonday, ephemeral: true});

  const monday = date.addDay(1 - date.weekDay());
  const {days, goal} = await getWeekSummary(interaction.user.id, monday);
  const streak = await db.streak.get(interaction.user.id, monday.addDay(6));

  const avatarUrl = interaction.user.displayAvatarURL({extension: 'png', size: 512});
  const img = await renderWeeklySummaryImage({avatarUrl, monday, days, goal, streak});

  return interaction.reply({
    content: resumeLang.replyAction.message(interaction.user.id, monday),
    files: [new AttachmentBuilder(img, {name: `weekly-${interaction.user.id}-${monday.toDateString()}.png`})]
  });
}

export default {commandName, data, execute};
