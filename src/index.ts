import {Client, Events, GatewayIntentBits} from "discord.js";
import {guildId, token} from "./secrets";
import {commandsExecutors} from "./commands";
import { deployCommands } from "./deploy-commands";
import { listUsers, getGoal, shouldSendDailyPrompt, markDailyPrompt, shouldSendWeeklySummary, markWeeklySummary, getWeekSummary } from './steps/storage';
import {DateTime} from "luxon";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages]
});

client.once(Events.ClientReady, async () => {
	console.log("Discord bot is ready! 🤖");
	startScheduler();
	await deployCommands(guildId);
});


client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const { commandName } = interaction;
		const executor = commandsExecutors[commandName];
		if (executor !== undefined) {
			await executor(interaction);
		}
	}
});

function startScheduler() {
	// Vérification chaque minute
	setInterval(async () => {
		try {
			const zone = 'Europe/Paris';
			const now = DateTime.now().setZone(zone);
			const dateISO = now.toISODate() || now.toFormat('yyyy-MM-dd');

			// Rappel quotidien (si >= 19:00 et pas encore envoyé)
			if (now.hour >= 19) {
				if (await shouldSendDailyPrompt(dateISO)) {
					await sendDailyPrompts(dateISO, now);
					await markDailyPrompt(dateISO);
				}
			}

			// Résumé hebdo : lundi 08:00 (ou plus tard si bot démarre après)
			if (now.weekday === 1 && now.hour >= 8) { // 1 = lundi
				const mondayCurrentWeek = now.minus({ days: 0 }).startOf('day');
				// On veut résumer la semaine complète précédente (lundi -> dimanche)
				const mondayPrev = mondayCurrentWeek.minus({ days: 7 });
				const mondayPrevISO = mondayPrev.toISODate() || mondayPrev.toFormat('yyyy-MM-dd');
				if (await shouldSendWeeklySummary(mondayPrevISO)) {
					await sendWeeklySummaries(mondayPrevISO);
					await markWeeklySummary(mondayPrevISO);
				}
			}
		} catch (e) {
			console.error('Scheduler error', e);
		}
	}, 60 * 1000);
}

async function sendDailyPrompts(dateISO: string, now: DateTime) {
	const users = await listUsers();
	for (const userId of users) {
		try {
			const goal = await getGoal(userId);
			if (!goal || goal === 0) continue; // seulement si objectif défini
			const user = await client.users.fetch(userId);
			await user.send(`Salut ! Il est ${now.toFormat('HH:mm')} Europe/Paris. Combien de milliers de pas aujourd'hui (${dateISO}) ? Utilise la commande /pas dans le serveur: /pas milliers:<n>. Objectif: ${goal * 1000} pas.`);
		} catch (e) {
			console.warn('Impossible d\'envoyer le DM à', userId, e);
		}
	}
}

async function sendWeeklySummaries(mondayISO: string) {
	const users = await listUsers();
	for (const userId of users) {
		try {
			const summary = await getWeekSummary(userId, mondayISO);
			if ((summary.goal ?? 0) === 0 && summary.total === 0) continue; // rien à dire
			const user = await client.users.fetch(userId);
			const lines: string[] = [];
			lines.push(`Résumé semaine du ${mondayISO} au ${DateTime.fromISO(mondayISO, { zone: 'Europe/Paris' }).plus({ days: 6 }).toISODate()}`);
			if (summary.goal) lines.push(`Objectif quotidien: ${summary.goal * 1000} pas`);
			for (const d of summary.days) {
				const val = d.value !== undefined ? (d.value * 1000).toString() : '-';
				const badge = summary.goal && d.value !== undefined && d.value >= summary.goal ? '✅' : '';
				lines.push(`${d.date}: ${val} ${badge}`);
			}
			lines.push(`Total: ${summary.total * 1000} pas`);
			lines.push(`Moyenne: ${Math.round(summary.average * 1000)} pas/jour`);
			if (summary.goal) lines.push(`Jours objectif atteint: ${summary.successDays}/7`);
			await user.send('```\n' + lines.join('\n') + '\n```');
		} catch (e) {
			console.warn('Impossible d\'envoyer le résumé à', userId, e);
		}
	}
}

client.login(token).then(() => console.log("Connecté"))
