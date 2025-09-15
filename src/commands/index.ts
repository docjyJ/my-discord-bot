import ping from "./ping";
import objectif from "./objectif";
import pas from "./pas";
import resumeSemaine from "./resume-semaine";
import {ChatInputCommandInteraction, InteractionResponse} from "discord.js";

export const commandsData = [
	ping.data,
	objectif.data,
	pas.data,
	resumeSemaine.data,
];

export const commandsExecutors: Partial<Record<string, (interaction: ChatInputCommandInteraction) => Promise<InteractionResponse | any>>> = {
	[ping.commandName]: ping.execute,
	[objectif.commandName]: objectif.execute,
	[pas.commandName]: pas.execute,
	[resumeSemaine.commandName]: resumeSemaine.execute,
};
