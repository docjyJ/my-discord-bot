import {ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, User} from 'discord.js';
import { setGoal, getGoal } from '../steps/storage';

export const commandName = 'objectif';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription("Afficher ou définir un objectif quotidien (en pas, arrondi au millier)")
  .addUserOption(o => o.setName('utilisateur')
    .setDescription('Utilisateur cible (défaut: toi)')
  )
  .addIntegerOption(o => o.setName('pas')
    .setDescription('Nouvel objectif en pas (sera arrondi au millier)')
    .setMinValue(0)
  );

function roundTo1000(v: number) { return Math.round(v / 1000) * 1000; }

export async function execute(interaction: ChatInputCommandInteraction) {
  const pasInput = interaction.options.getInteger('pas');
  const targetUser: User = interaction.options.getUser('utilisateur') || interaction.user;

  if (pasInput !== null) {
    if (targetUser.id !== interaction.user.id) {
      return interaction.reply({ content: "tu ne peux pas définir l'objectif d'un autre utilisateur", flags: MessageFlags.Ephemeral});
    }
    if (pasInput < 0) {
      return interaction.reply({ content: 'valeur invalide: doit être >= 0.', flags: MessageFlags.Ephemeral });
    }
    const arrondi = roundTo1000(pasInput);
    await setGoal(targetUser.id, arrondi); // stockage brut
    return interaction.reply({ content: `le nouvel objectif de <@${targetUser.id}> est d'environ ${arrondi} pas / jour (arrondi)` });
  }

  const goal = await getGoal(targetUser.id);
  if (!goal || goal === 0) {
    return interaction.reply({ content: `<@${targetUser.id}> n'a pas d'objectif` });
  }
  return interaction.reply({ content: `l'objectif de <@${targetUser.id}> est d'environ ${goal} pas / jour` });
}

export default { commandName, data, execute };