import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import {getStreak, getWeekSummary} from '../steps/storage';
import {resumeSemaine as resumeLang} from '../lang';
import {renderWeeklySummaryImage} from '../image/renderer';
import DateTime from "../date-time";

export const commandName = 'resume-semaine';

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription(resumeLang.command.description)
	.addStringOption(o => o.setName('lundi')
		.setDescription(resumeLang.command.optionLundiDescription)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const lundiOpt = interaction.options.getString('lundi');
	let monday;
	if (lundiOpt) {
		monday = DateTime.parse(lundiOpt);
		if (monday === null) {
			return interaction.reply({content: resumeLang.replyAction.invalidMonday, ephemeral: true});
		}
	} else {
		monday = DateTime.now();
	}
	monday = monday.subtract(monday.weekDay() - 1)
	const mondayISO = monday.toISO();
	const {days, goal} = await getWeekSummary(interaction.user.id, mondayISO);
	const sundayISO = monday.add(6).toISO();
	const streak = await getStreak(interaction.user.id, sundayISO);

	const avatarUrl = interaction.user.displayAvatarURL({extension: 'png', size: 512});
	const img = await renderWeeklySummaryImage({avatarUrl, mondayISO, days, goal, streak});

	return interaction.reply({
		content: resumeLang.replyAction.message(interaction.user.id, mondayISO),
		files: [new AttachmentBuilder(img, {name: `weekly-${interaction.user.id}-${mondayISO}.png`})]
	});
}

export default {commandName, data, execute};