import type {ChatInputCommandInteraction, InteractionCallbackResponse, InteractionResponse} from 'discord.js';
import objectif from './objectif';
import resumeSemaine from './resume-semaine';
import saisir from './saisir';

export const commandsData = [objectif.data, saisir.data, resumeSemaine.data];

export const commandsExecutors: Partial<
  Record<
    string,
    (interaction: ChatInputCommandInteraction) => Promise<InteractionResponse | InteractionCallbackResponse>
  >
> = {
  [objectif.commandName]: objectif.execute,
  [saisir.commandName]: saisir.execute,
  [resumeSemaine.commandName]: resumeSemaine.execute
};
