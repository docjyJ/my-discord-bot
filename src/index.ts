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

dayjs.extend(utc);
dayjs.extend(timezone);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages]
});

client.once(Events.ClientReady, async () => {
  console.log('Discord bot is ready! 🤖');
  startScheduler();
  await deployCommands(guildId);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const executor = commandsExecutors[interaction.commandName];
    if (executor) await executor(interaction);
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('saisir-btn-')) {
      const dateISO = interaction.customId.substring('saisir-btn-'.length);
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
		console.log('Scheduler tick', new Date().toISOString());
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
      console.error('Scheduler error', e);
    }
		console.log('Fin du tick');
  }, 60 * 1000);
}

async function sendDailyPrompts(dateISO: string, now: dayjs.Dayjs) {
	console.log('Envoi des rappels pour', dateISO);
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
	console.log('Canal de rappel:', channelFetched?.id);
  if (!channelFetched || !channelFetched.isTextBased()) return;
  const textChannel = channelFetched as TextChannel;
  const mentions = notFilled.map(id => `<@${id}>`).join(' ');
  await textChannel.send({
    content: `Il est ${now.format('HH:mm')} Europe/Paris. ${mentions}\nVous n'avez pas encore saisi vos pas du ${dateISO}. Cliquez sur le bouton ci-dessous pour enregistrer.`,
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`saisir-btn-${dateISO}`)
          .setLabel('Saisir ma journée')
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
      console.warn('Impossible d\'envoyer le résumé pour', userId, e);
    }
  }
}

client.login(token).then(() => console.log('Connecté'));
