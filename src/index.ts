import {ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Events, GatewayIntentBits, TextChannel} from 'discord.js';
import {channelId, guildId, token} from './secrets';
import {commandsExecutors} from './commands';
import {deployCommands} from './deploy-commands';
import {
	getEntry,
	getGoal,
	getStreak,
	getWeekSummary,
	listUsers,
	markDailyPrompt,
	markWeeklySummary,
	shouldSendDailyPrompt,
	shouldSendWeeklySummary
} from './storage';
import {renderWeeklySummaryImage} from './image/renderer';
import {lang, saisir as saisirLang} from './lang';
import {getSaisirModal, modalsExecutor} from "./modals";
import DateTime from "./date-time";

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
	setInterval(async () => {
		if (schedulerRunning) return; // éviter les overlaps
		schedulerRunning = true;
		const now = DateTime.now()
		console.log(lang.scheduler.schedulerTick(now));
		try {
			if (now.hour() >= 19) {
				if (await shouldSendDailyPrompt(now)) {
					await sendDailyPrompts(now);
					await markDailyPrompt(now);
				}
			}

			if (now.weekDay() === 1 && now.hour() >= 8) {
				const mondayPrev = now.addDay(-7);
				if (await shouldSendWeeklySummary(mondayPrev)) {
					await sendWeeklySummaries(mondayPrev);
					await markWeeklySummary(mondayPrev);
				}
			}
		} catch (e) {
			console.error(lang.scheduler.schedulerError, e);
		} finally {
			console.log(lang.scheduler.schedulerEndTick);
			schedulerRunning = false;
		}
	}, 60 * 1000);
}

async function sendDailyPrompts(now: DateTime) {
	console.log(lang.scheduler.sendingRemindersFor(now));
	const users = await listUsers();
	const notFilled: string[] = [];
	for (const userId of users) {
		const {stepsGoal} = await getGoal(userId);
		if (!stepsGoal || stepsGoal === 0) continue;
		const {steps} = await getEntry(userId, now);
		if (steps === null) notFilled.push(userId);
	}
	if (notFilled.length === 0) return;
	const channelFetched = await client.channels.fetch(channelId);
	console.log(lang.scheduler.reminderChannel, channelFetched?.id);
	if (!channelFetched || !channelFetched.isTextBased()) return;
	const textChannel = channelFetched as TextChannel;
	await textChannel.send({
		content: notFilled.length > 1
			? lang.scheduler.dailyPromptMessage(now.toTimeString(), notFilled, now)
			: lang.scheduler.dailyPromptMessageSingle(now.toTimeString(), notFilled[0], now),
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`${saisirLang.ids.buttonPrefix}${now.toDateString()}`)
					.setLabel(saisirLang.button.label)
					.setStyle(ButtonStyle.Primary)
			)
		]
	});
}

async function sendWeeklySummaries(monday: DateTime) {
	const channelFetched = await client.channels.fetch(channelId);
	if (!channelFetched || !channelFetched.isTextBased()) return;
	const textChannel = channelFetched as TextChannel;

	const users = await listUsers();
	for (const userId of users) {
		try {
			const {days, goal} = await getWeekSummary(userId, monday);
			if ((goal ?? 0) === 0 && days.every(d => (d ?? 0) === 0)) continue;

			const user = await client.users.fetch(userId);
			const avatarUrl = user.displayAvatarURL({extension: 'png', size: 512});

			const streak = await getStreak(userId, monday.addDay(6));

			const img = await renderWeeklySummaryImage({avatarUrl, monday, days, goal, streak});

			await textChannel.send({
				content: lang.scheduler.weeklySummaryMessage(userId, monday),
				files: [{attachment: img, name: `weekly-${userId}-${monday.toDateString()}.png`}]
			});
		} catch (e) {
			console.warn(lang.scheduler.weeklySummarySendError, userId, e);
		}
	}
}

client.login(token).then(() => console.log(lang.scheduler.connected));
