import {ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, type TextChannel} from 'discord.js';
import {client} from './client';
import {commandsExecutors} from './commands';
import DateTime from './date-time';
import {deployCommands} from './deploy-commands';
import {lang, saisir as saisirLang} from './lang';
import {getSaisirModal, modalsExecutor} from './modals';
import {channelId, guildId, token} from './secrets';
import {getDailyGoal, getEntry, getLastDailyPrompt, listUsers, setLastDailyPrompt} from './storage';

client.once(Events.ClientReady, async () => {
  console.log(lang.scheduler.ready);
  startScheduler();
  await deployCommands(guildId);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const executor = commandsExecutors[interaction.commandName];
    if (executor) await executor(interaction);
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith(saisirLang.ids.buttonPrefix)) {
      const dateISO = interaction.customId.substring(saisirLang.ids.buttonPrefix.length);
      // biome-ignore lint/style/noNonNullAssertion: modal should always be valid here
      const modal = await getSaisirModal(DateTime.parse(dateISO)!, interaction.user.id);
      await interaction.showModal(modal);
    }
  } else if (interaction.isModalSubmit()) {
    const [id, ...rest] = interaction.customId.split('/');
    const executor = modalsExecutor[id];
    if (executor) await executor(interaction, rest);
  }
});

let schedulerRunning = false;

function startScheduler() {
  setInterval(
    async () => {
      if (schedulerRunning) return; // éviter les overlaps
      schedulerRunning = true;
      const now = DateTime.now();
      console.log(lang.scheduler.schedulerTick(now));
      try {
        if (now.hour() === 0) {
          const yesterday = now.addDay(-1);
          const lastPrompt = await getLastDailyPrompt();
          if (!lastPrompt?.sameDay(yesterday)) {
            await sendDailyPrompts(yesterday);
            await setLastDailyPrompt(yesterday);
          }
        }
      } catch (e) {
        console.error(lang.scheduler.schedulerError, e);
      } finally {
        console.log(lang.scheduler.schedulerEndTick);
        schedulerRunning = false;
      }
    },
    60 * 1000 * 5
  );
}

async function sendDailyPrompts(now: DateTime) {
  console.log(lang.scheduler.sendingRemindersFor(now));
  const users = await listUsers();
  const notFilled: string[] = [];
  for (const userId of users) {
    const stepsGoal = await getDailyGoal(userId);
    if (!stepsGoal || stepsGoal === 0) continue;
    const steps = await getEntry(userId, now);
    if (steps === null) notFilled.push(userId);
  }
  if (notFilled.length === 0) return;
  const channelFetched = await client.channels.fetch(channelId);
  console.log(lang.scheduler.reminderChannel, channelFetched?.id);
  if (!channelFetched || !channelFetched.isTextBased()) return;
  const textChannel = channelFetched as TextChannel;
  await textChannel.send({
    content: notFilled.length > 1 ? lang.scheduler.dailyPromptMessage(notFilled, now) : lang.scheduler.dailyPromptMessageSingle(notFilled[0], now),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`${saisirLang.ids.buttonPrefix}${now.toDateString()}`).setLabel(saisirLang.button.label).setStyle(ButtonStyle.Primary)
      )
    ]
  });
}

client.login(token).then(() => console.log(lang.scheduler.connected));
