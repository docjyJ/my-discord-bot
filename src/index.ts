import {Client, Events, GatewayIntentBits} from "discord.js";
import { token } from "./secrets";
import {commandsExecutors} from "./commands";
import { deployCommands } from "./deploy-commands";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages]
});

client.once(Events.ClientReady, async () => {
	console.log("Discord bot is ready! 🤖");
});

client.on(Events.GuildCreate, async (guild) => {
	console.log(`Joined a new guild: ${guild.name} (id: ${guild.id})`);
	await deployCommands({ guildId: guild.id });
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isCommand()) {
		return;
	}
	const { commandName } = interaction;
	const executor = commandsExecutors[commandName];
	if (executor !== undefined) {
		await executor(interaction);
	}
});

client.login(token).then(() => console.log("Connecté"))
