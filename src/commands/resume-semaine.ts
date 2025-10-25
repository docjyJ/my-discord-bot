import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {getStreak, getWeekSummary} from '../steps/storage';
import {resumeSemaine as resumeLang} from '../lang';
import {renderWeeklySummaryImage} from '../image/renderer';

dayjs.extend(utc);
dayjs.extend(timezone);

export const commandName = 'resume-semaine';

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription(resumeLang.command.description)
	.addStringOption(o => o.setName('lundi')
		.setDescription(resumeLang.command.optionLundiDescription)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const lundiOpt = interaction.options.getString('lundi') || undefined;
	const zone = 'Europe/Paris';
	let monday;
	if (lundiOpt) {
		monday = dayjs.tz(lundiOpt, zone);
		if (!monday.isValid()) {
			return interaction.reply({content: resumeLang.replyAction.invalidMonday, ephemeral: true});
		}
	} else {
		const now = dayjs().tz(zone);
		monday = now.subtract(now.day() - 1, 'day').startOf('day');
	}
	const mondayISO = monday.format('YYYY-MM-DD');
	const {days, goal} = await getWeekSummary(interaction.user.id, mondayISO);
	const sundayISO = monday.add(6, 'day').format('YYYY-MM-DD');
	const streak = await getStreak(interaction.user.id, sundayISO);

	const avatarUrl = interaction.user.displayAvatarURL({extension: 'png', size: 512});
	const img = await renderWeeklySummaryImage({
		username: `@${interaction.user.username}`,
		avatarUrl,
		mondayISO,
		days,
		goal,
		streak,
	});
	const file = new AttachmentBuilder(img, {name: `weekly-${interaction.user.id}-${mondayISO}.png`});

	return interaction.reply({
		content: `<@${interaction.user.id}>`,
		files: [file]
	});
}

export default {commandName, data, execute};