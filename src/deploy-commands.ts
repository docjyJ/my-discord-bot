
import { REST, Routes } from "discord.js";
import {commandsData} from "./commands";
import {applicationId, token} from "./secrets";


const rest = new REST({ version: "10" }).setToken(token);

type DeployCommandsProps = {
	guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(applicationId, guildId),
			{
				body: commandsData,
			}
		);

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
}
