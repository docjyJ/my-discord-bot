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
} from './steps/storage';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {getModale as saisirGetModale, handleModalSubmit as saisirHandleModalSubmit} from './commands/saisir';
import {handleModalSubmit as objectifHandleModalSubmit} from './commands/objectif';
import {renderWeeklySummaryImage} from './image/renderer';
import {lang, saisir as saisirLang} from './lang';

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
		if (steps === null) notFilled.push(userId);
	}
	if (notFilled.length === 0) return;
	const channelFetched = await client.channels.fetch(channelId);
	console.log(lang.scheduler.reminderChannel, channelFetched?.id);
	if (!channelFetched || !channelFetched.isTextBased()) return;
	const textChannel = channelFetched as TextChannel;
	await textChannel.send({
		content: notFilled.length > 1
			? lang.scheduler.dailyPromptMessage(now.format('HH:mm'), notFilled, dateISO)
			: lang.scheduler.dailyPromptMessageSingle(now.format('HH:mm'), notFilled[0], dateISO),
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
			const {days, goal} = await getWeekSummary(userId, mondayISO);
			if ((goal ?? 0) === 0 && days.every(d => (d ?? 0) === 0)) continue;

			// Fetch user to get username and avatar
			const user = await client.users.fetch(userId);
			const username = `@${user.username}`;
			const avatarUrl = user.displayAvatarURL({extension: 'png', size: 512});

			const sundayISO = dayjs(mondayISO).add(6, 'day').format('YYYY-MM-DD');
			const streak = await getStreak(userId, sundayISO);

			const img = await renderWeeklySummaryImage({
				username,
				avatarUrl,
				mondayISO,
				days,
				goal,
				streak,
			});

			await textChannel.send({
				content: `<@${userId}>`,
				files: [{attachment: img, name: `weekly-${userId}-${mondayISO}.png`}]
			});
		} catch (e) {
			console.warn(lang.scheduler.weeklySummarySendError, userId, e);
		}
	}
}

client.login(token).then(() => console.log(lang.scheduler.connected));
