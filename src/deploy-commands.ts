import {REST, Routes} from 'discord.js';
import {commandsData} from './commands';
import {lang} from './lang';
import {applicationId, token} from './secrets';

const rest = new REST({version: '10'}).setToken(token);

export async function deployCommands(guildId: string) {
  try {
    console.log(lang.deploy.start);
    const body = commandsData.map(c => c.toJSON());
    await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {body});
    console.log(lang.deploy.success(body.length));
  } catch (error) {
    console.error(lang.deploy.error, error);
  }
}
