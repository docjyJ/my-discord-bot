import { Client, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import {channelId, guildId, token} from './secrets';
import { commandsExecutors } from './commands';
import { deployCommands } from './deploy-commands';
import { listUsers, getGoal, shouldSendDailyPrompt, markDailyPrompt, shouldSendWeeklySummary, markWeeklySummary, getWeekSummary, getEntry } from './steps/storage';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {handleModalSubmit as saisirHandleModalSubmit, getModale as saisirGetModale} from './commands/saisir';
import {handleModalSubmit as objectifHandleModalSubmit} from './commands/objectif';
import { buildWeekMessage } from './commands/resume-semaine';
import { lang, saisir as saisirLang } from './lang';

dayjs.extend(utc);
dayjs.extend(timezone);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages]
});

client.once(Events.ClientReady, async () => {
  console.log(lang.scheduler.ready);
  startScheduler();
  await deployCommands(guildId);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const executor = commandsExecutors[interaction.commandName];
    if (executor) await executor(interaction);
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith(saisirLang.ids.buttonPrefix)) {
      const dateISO = interaction.customId.substring(saisirLang.ids.buttonPrefix.length);
      const modal = await saisirGetModale(dateISO, interaction.user.id);
      await interaction.showModal(modal);
    }
  } else if (interaction.isModalSubmit()) {
    await saisirHandleModalSubmit(interaction);
    await objectifHandleModalSubmit(interaction);
  }
});

function startScheduler() {
  setInterval(async () => {
		console.log(lang.scheduler.schedulerTick, new Date().toISOString());
    try {
      const zone = 'Europe/Paris';
      const now = dayjs().tz(zone);
      const dateISO = now.format('YYYY-MM-DD');

      if (now.hour() >= 19) {
        if (await shouldSendDailyPrompt(dateISO)) {
          await sendDailyPrompts(dateISO, now);
          await markDailyPrompt(dateISO);
        }
      }

      if (now.day() === 1 && now.hour() >= 8) { // lundi
        const mondayCurrentWeek = now.startOf('day');
        const mondayPrev = mondayCurrentWeek.subtract(7, 'day');
        const mondayPrevISO = mondayPrev.format('YYYY-MM-DD');
        if (await shouldSendWeeklySummary(mondayPrevISO)) {
          await sendWeeklySummaries(mondayPrevISO);
          await markWeeklySummary(mondayPrevISO);
        }
      }
    } catch (e) {
      console.error(lang.scheduler.schedulerError, e);
    }
		console.log(lang.scheduler.schedulerEndTick);
  }, 60 * 1000);
}

async function sendDailyPrompts(dateISO: string, now: dayjs.Dayjs) {
	console.log(lang.scheduler.sendingRemindersFor, dateISO);
  const users = await listUsers();
  const notFilled: string[] = [];
  for (const userId of users) {
    const {stepsGoal} = await getGoal(userId);
    if (!stepsGoal || stepsGoal === 0) continue; // ignorer sans objectif
    const {steps} = await getEntry(userId, dateISO);
    if (steps === undefined) notFilled.push(userId);
  }
  if (notFilled.length === 0) return;
  const channelFetched = await client.channels.fetch(channelId);
	console.log(lang.scheduler.reminderChannel, channelFetched?.id);
  if (!channelFetched || !channelFetched.isTextBased()) return;
  const textChannel = channelFetched as TextChannel;
  const mentions = notFilled.map(id => `<@${id}>`).join(' ');
  await textChannel.send({
    content: lang.scheduler.dailyPromptMessage(now.format('HH:mm'), mentions, dateISO),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${saisirLang.ids.buttonPrefix}${dateISO}`)
          .setLabel(saisirLang.button.label)
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });
}

async function sendWeeklySummaries(mondayISO: string) {
  const channelFetched = await client.channels.fetch(channelId);
  if (!channelFetched || !channelFetched.isTextBased()) return;
  const textChannel = channelFetched as TextChannel;

  const users = await listUsers();
  for (const userId of users) {
    try {
      const summary = await getWeekSummary(userId, mondayISO);
      if ((summary.goal ?? 0) === 0 && summary.total === 0) continue;

      const message = buildWeekMessage(userId, summary, mondayISO);
      await textChannel.send(message);
    } catch (e) {
      console.warn(lang.scheduler.weeklySummarySendError, userId, e);
    }
  }
}

client.login(token).then(() => console.log(lang.scheduler.connected));
