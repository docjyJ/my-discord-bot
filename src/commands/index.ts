import * as ping from "./ping";
import {CommandInteraction, InteractionResponse, SlashCommandBuilder} from "discord.js";

export const commandsData: Array<SlashCommandBuilder> = [
	ping.data,
]

export const commandsExecutors:  Partial<Record<string, (interaction: CommandInteraction) => Promise<InteractionResponse>>>	= {
	[ping.commandName]: ping.execute,
}