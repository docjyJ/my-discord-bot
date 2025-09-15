import {ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, User} from 'discord.js';
import { setGoal, getGoal } from '../steps/storage';

export const commandName = 'objectif';

export const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription('Afficher ou définir un objectif quotidien (en pas, 0 pour aucun)')
  .addUserOption(o => o.setName('utilisateur')
    .setDescription('Utilisateur cible (défaut: toi)')
  )
  .addIntegerOption(o => o.setName('pas')
    .setDescription('Nouvel objectif en pas (multiple de 1000, 0 pour enlever)')
    .setMinValue(0)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const pas = interaction.options.getInteger('pas');
  const targetUser: User = interaction.options.getUser('utilisateur') || interaction.user;

  if (pas !== null) {
    if (targetUser.id !== interaction.user.id) {
      return interaction.reply({ content: "tu ne peux pas définir l'objectif d'un autre utilisateur", flags: MessageFlags.Ephemeral});
    }
    if (pas < 0) {
      return interaction.reply({ content: 'valeur invalide: doit être >= 0.', flags: MessageFlags.Ephemeral });
    }
    if (pas % 1000 !== 0) {
      return interaction.reply({ content: 'valeur invalide: doit être un multiple de 1000.', flags: MessageFlags.Ephemeral });
    }
    const thousands = pas / 1000;
    await setGoal(targetUser.id, thousands);
    return interaction.reply({ content: `le nouvel objectif de <@${targetUser.id}> est ${pas} pas / jour` });
  }

  const goalThousands = await getGoal(targetUser.id);
  if (!goalThousands || goalThousands === 0) {
    return interaction.reply({ content: `<@${targetUser.id}> n'a pas d'objectif` });
  }
  return interaction.reply({ content: `l'objectif de <@${targetUser.id}> est ${goalThousands * 1000} pas / jour` });
}

export default { commandName, data, execute };