import {REST, Routes} from "discord.js";
import {commandsData} from "./commands";
import {applicationId, token} from "./secrets";


const rest = new REST({version: "10"}).setToken(token);

export async function deployCommands(guildId: string) {
	try {
		console.log("Synchronisation complète des commandes (/)...");
		const body = commandsData.map(c => c.toJSON());
		await rest.put(
			Routes.applicationGuildCommands(applicationId, guildId),
			{ body }
		);
		console.log(`Commandes synchronisées (${body.length}). ✅`);
	} catch (error) {
		console.error("Erreur lors du déploiement des commandes", error);
	}
}
