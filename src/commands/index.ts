import objectif from "./objectif";
import saisir from "./saisir";
import resumeSemaine from "./resume-semaine";
import {ChatInputCommandInteraction, InteractionResponse} from "discord.js";

export const commandsData = [
	objectif.data,
	saisir.data,
	resumeSemaine.data,
];

export const commandsExecutors: Partial<Record<string, (interaction: ChatInputCommandInteraction) => Promise<InteractionResponse | any>>> = {
	[objectif.commandName]: objectif.execute,
	[saisir.commandName]: saisir.execute,
	[resumeSemaine.commandName]: resumeSemaine.execute,
};
