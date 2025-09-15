import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DateTime } from 'luxon';
import { getWeekSummary } from '../steps/storage';

export const commandName = 'resume-semaine';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription('Afficher un résumé de la semaine (lundi->dimanche)')
  .addStringOption(o => o.setName('lundi')
    .setDescription('Date du lundi (AAAA-MM-JJ) de la semaine à résumer (optionnel)')
  );

function formatSummary(summary: Awaited<ReturnType<typeof getWeekSummary>>, mondayISO: string): string {
  const lines: string[] = [];
  const endISO = DateTime.fromISO(mondayISO, { zone: 'Europe/Paris' }).plus({ days: 6 }).toISODate() || mondayISO;
  lines.push(`Semaine du ${mondayISO} au ${endISO}`);
  if (summary.goal) lines.push(`Objectif quotidien: ${summary.goal * 1000} pas`);
  lines.push('Jours:');
  for (const d of summary.days) {
    const val = d.value !== undefined ? (d.value * 1000).toString() : '-';
    const badge = summary.goal && d.value !== undefined && d.value >= summary.goal ? '✅' : '';
    lines.push(` - ${d.date}: ${val} ${badge}`);
  }
  lines.push(`Total: ${summary.total * 1000} pas`);
  lines.push(`Moyenne: ${Math.round(summary.average * 1000)} pas / jour`);
  if (summary.goal) lines.push(`Jours objectif atteint: ${summary.successDays}/7`);
  return lines.join('\n');
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const lundiOpt = interaction.options.getString('lundi') || undefined;
  const zone = 'Europe/Paris';
  let monday: DateTime;
  if (lundiOpt) {
    monday = DateTime.fromISO(lundiOpt, { zone });
    if (!monday.isValid) {
      return interaction.reply({ content: 'Date du lundi invalide.', ephemeral: true });
    }
  } else {
    const now = DateTime.now().setZone(zone);
    monday = now.minus({ days: now.weekday - 1 }).startOf('day');
  }
  const mondayISO = monday.toISODate() || monday.toFormat('yyyy-MM-dd');
  const summary = await getWeekSummary(interaction.user.id, mondayISO);
  const txt = formatSummary(summary, mondayISO);
  return interaction.reply({ content: '```\n' + txt + '\n```', ephemeral: true });
}

export default { commandName, data, execute };