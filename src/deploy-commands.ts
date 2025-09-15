import {REST, Routes} from "discord.js";
import {commandsData} from "./commands";
import {applicationId, token} from "./secrets";


const rest = new REST({version: "10"}).setToken(token);

type DeployCommandsProps = {
	guildId: string;
};

export async function deployCommands(guildId: string) {
	try {
		console.log("Vérification des commandes (/) existantes...");

		// Récupère les commandes déjà présentes sur le serveur
		const existing = await rest.get(
			Routes.applicationGuildCommands(applicationId, guildId)
		) as any[];
		const existingNames = new Set(existing.map(c => c.name));

		// Filtre uniquement celles qui n'existent pas encore
		const missing = commandsData.filter(cmd => {
			const json = cmd.toJSON();
			return !existingNames.has(json.name);
		});

		if (missing.length === 0) {
			console.log("Aucune nouvelle commande à créer. ✅");
			return;
		}

		console.log(`Création de ${missing.length} nouvelle(s) commande(s): ${missing.map(m => m.toJSON().name).join(', ')}`);

		// Création en parallèle (petit volume) ; possibilité de séquencer si besoin d'éviter le rate limit
		await Promise.all(missing.map(async cmd => {
			await rest.post(
				Routes.applicationGuildCommands(applicationId, guildId),
				{ body: cmd.toJSON() }
			);
		}));

		console.log("Création des nouvelles commandes terminée. ✅");
	} catch (error) {
		console.error("Erreur lors du déploiement sélectif des commandes", error);
	}
}
