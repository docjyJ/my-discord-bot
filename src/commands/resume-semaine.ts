import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getWeekSummary } from '../steps/storage';
dayjs.extend(utc);
dayjs.extend(timezone);

export const commandName = 'resume-semaine';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription('Afficher un résumé de la semaine (lundi->dimanche)')
  .addStringOption(o => o.setName('lundi')
    .setDescription('Date du lundi (AAAA-MM-JJ) de la semaine à résumer (optionnel)')
  );

function formatSummary(summary: Awaited<ReturnType<typeof getWeekSummary>>, mondayISO: string): string {
  const lines: string[] = [];
  const monday = dayjs.tz(mondayISO, 'Europe/Paris');
  const endISO = monday.add(6, 'day').format('YYYY-MM-DD');
  lines.push(`Semaine du ${mondayISO} au ${endISO}`);
  if (summary.goal) lines.push(`Objectif quotidien: ≈ ${summary.goal} pas`);
  lines.push('Jours:');
  for (const d of summary.days) {
    const val = d.value !== undefined ? `≈ ${d.value}` : '-';
    const badge = summary.goal && d.value !== undefined && d.value >= summary.goal ? '✅' : '';
    lines.push(` - ${d.date}: ${val} ${badge}`);
  }
  lines.push(`Total: ≈ ${summary.total} pas`);
  lines.push(`Moyenne: ≈ ${Math.round(summary.average / 1000) * 1000} pas / jour`);
  if (summary.goal) lines.push(`Jours objectif atteint: ${summary.successDays}/7`);
  return lines.join('\n');
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const lundiOpt = interaction.options.getString('lundi') || undefined;
  const zone = 'Europe/Paris';
  let monday;
  if (lundiOpt) {
    monday = dayjs.tz(lundiOpt, zone);
    if (!monday.isValid()) {
      return interaction.reply({ content: 'Date du lundi invalide.', ephemeral: true });
    }
  } else {
    const now = dayjs.tz(zone);
    monday = now.subtract(now.day() - 1, 'day').startOf('day');
  }
  const mondayISO = monday.format('YYYY-MM-DD');
  const summary = await getWeekSummary(interaction.user.id, mondayISO);
  const txt = formatSummary(summary, mondayISO);
  return interaction.reply({ content: '```\n' + txt + '\n```', ephemeral: true });
}

export default { commandName, data, execute };