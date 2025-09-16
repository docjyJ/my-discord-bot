import ping from "./ping";
import objectif from "./objectif";
import saisir from "./saisir";
import resumeSemaine from "./resume-semaine";
import {ChatInputCommandInteraction, InteractionResponse} from "discord.js";

export const commandsData = [
	ping.data,
	objectif.data,
	saisir.data,
	resumeSemaine.data,
];

export const commandsExecutors: Partial<Record<string, (interaction: ChatInputCommandInteraction) => Promise<InteractionResponse | any>>> = {
	[ping.commandName]: ping.execute,
	[objectif.commandName]: objectif.execute,
	[saisir.commandName]: saisir.execute,
	[resumeSemaine.commandName]: resumeSemaine.execute,
};
