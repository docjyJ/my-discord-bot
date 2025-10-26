import objectif from "./objectif";
import saisir from "./saisir";
import resumeSemaine from "./resume-semaine";
import {ChatInputCommandInteraction, InteractionCallbackResponse, InteractionResponse} from "discord.js";

export const commandsData = [
	objectif.data,
	saisir.data,
	resumeSemaine.data,
];

export const commandsExecutors: Partial<Record<string, (interaction: ChatInputCommandInteraction) => Promise<InteractionResponse | InteractionCallbackResponse>>> = {
	[objectif.commandName]: objectif.execute,
	[saisir.commandName]: saisir.execute,
	[resumeSemaine.commandName]: resumeSemaine.execute,
};
