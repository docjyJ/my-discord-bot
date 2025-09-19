import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getWeekSummary, WeekSummary } from '../steps/storage';
import { resumeSemaine as resumeLang } from '../lang';
dayjs.extend(utc);
dayjs.extend(timezone);

export const commandName = 'resume-semaine';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(resumeLang.command.description)
  .addStringOption(o => o.setName('lundi')
    .setDescription(resumeLang.command.optionLundiDescription)
  );

function bar(value: number | undefined, max: number, width = 32): string {
  if (!value || max <= 0) return ' '.repeat(width);
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function buildWeekMessage(userId: string | null, summary: WeekSummary, mondayISO: string) {
  const monday = dayjs.tz(mondayISO, 'Europe/Paris');
  const endISO = monday.add(6, 'day').format('YYYY-MM-DD');
  const maxVal = Math.max(
    summary.goal || 0,
    ...summary.days.map(d => d.value || 0)
  ) || 1;

  const chartLines: string[] = [];
  chartLines.push(resumeLang.text.header(mondayISO, endISO));
  if (summary.goal) chartLines.push(resumeLang.text.goalLine(summary.goal));
  chartLines.push('');
  for (const d of summary.days) {
    const badge = summary.goal && d.value !== undefined && d.value >= summary.goal ? '✅' : '  ';
    const vStr = d.value !== undefined ? `${d.value}` : '-';
    chartLines.push(`${badge} ${d.date} | ${bar(d.value, maxVal)} | ${vStr}`);
  }

  const avgRounded = Math.round(summary.average / 1000) * 1000;
  const desc = '```\n' + chartLines.join('\n') + '\n```';

  const embed = new EmbedBuilder()
    .setTitle(resumeLang.embed.title)
    .setDescription(desc)
    .addFields(
      { name: resumeLang.embed.fieldTotal, value: `≈ ${summary.total} pas`, inline: true },
      { name: resumeLang.embed.fieldAverage, value: `≈ ${avgRounded} pas/jour`, inline: true },
      ...(summary.goal ? [{ name: resumeLang.embed.fieldGoalReached, value: `${summary.successDays}/7`, inline: true }] : [])
    )
    .setColor(0x2ecc71);

  return {
    content: userId ? `<@${userId}>` : undefined,
    embeds: [embed]
  };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const lundiOpt = interaction.options.getString('lundi') || undefined;
  const zone = 'Europe/Paris';
  let monday;
  if (lundiOpt) {
    monday = dayjs.tz(lundiOpt, zone);
    if (!monday.isValid()) {
      return interaction.reply({ content: resumeLang.replyAction.invalidMonday, ephemeral: true });
    }
  } else {
    const now = dayjs().tz(zone);
    monday = now.subtract(now.day() - 1, 'day').startOf('day');
  }
  const mondayISO = monday.format('YYYY-MM-DD');
  const summary = await getWeekSummary(interaction.user.id, mondayISO);
  const message = buildWeekMessage(null, summary, mondayISO);
  return interaction.reply(message);
}

export default { commandName, data, execute };