import type {AttachmentBuilder} from 'discord.js';
import {AttachmentBuilder as DiscordAttachmentBuilder} from 'discord.js';
import {client} from '../client';
import type DateTime from '../date-time';
import {type MonthlySummaryData, renderMonthlySummaryImage} from '../image/monthly-summary';
import {renderWeeklySummaryImage} from '../image/weekly-summary';
import {getDataForMonthlySummary, getDataForWeeklySummary, isMonthComplete, isWeekComplete} from '../storage';

// Génère les résumés (hebdo/mois) et renvoie les pièces jointes éventuelles pour réponse
export async function maybeSendSummariesAfterEntry(
  userId: string,
  date: DateTime
): Promise<{
  attachments: AttachmentBuilder[];
  hasWeek: boolean;
  hasMonth: boolean;
}> {
  const attachments: AttachmentBuilder[] = [];
  let hasWeek = false;
  let hasMonth = false;
  const user = await client.users.fetch(userId);
  const monday = date.getMonday();
  const firstDayMonth = date.firstDayOfMonth();

  const weekComplete = await isWeekComplete(userId, date);
  if (weekComplete) {
    const weeklyData = await getDataForWeeklySummary(user, monday);
    if (!weeklyData.days.every(d => d === null)) {
      const img = await renderWeeklySummaryImage(weeklyData);
      attachments.push(new DiscordAttachmentBuilder(img, {name: `weekly-${userId}-${monday.toDateString()}.png`}));
      hasWeek = true;
    }
  }

  const monthComplete = await isMonthComplete(userId, date);
  if (monthComplete) {
    const monthlyData = (await getDataForMonthlySummary(user, firstDayMonth)) as MonthlySummaryData;
    if (!monthlyData.days.every(d => d === null)) {
      const img = await renderMonthlySummaryImage(monthlyData);
      attachments.push(new DiscordAttachmentBuilder(img, {name: `monthly-${userId}-${firstDayMonth.toDateString()}.png`}));
      hasMonth = true;
    }
  }

  return {attachments, hasWeek, hasMonth};
}
