import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const commandName = "ping";

export const data = new SlashCommandBuilder()
	.setName(commandName)
	.setDescription("Replies with Pong!");

export async function execute(interaction: CommandInteraction) {
	return interaction.reply("Pong!");
}

