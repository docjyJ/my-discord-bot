import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import {getStreak, getWeekSummary} from '../storage';
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
	monday = monday.addDay(1-monday.weekDay())
	const {days, goal} = await getWeekSummary(interaction.user.id, monday);
	const streak = await getStreak(interaction.user.id, monday.addDay(6));

	const avatarUrl = interaction.user.displayAvatarURL({extension: 'png', size: 512});
	const img = await renderWeeklySummaryImage({avatarUrl, monday, days, goal, streak});

	return interaction.reply({
		content: resumeLang.replyAction.message(interaction.user.id, monday),
		files: [new AttachmentBuilder(img, {name: `weekly-${interaction.user.id}-${monday.toDateString()}.png`})]
	});
}

export default {commandName, data, execute};