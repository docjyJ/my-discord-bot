import type DateTime from './date-time';

const fr = 'fr-FR';

export const lang = {
  scheduler: {
    ready: 'Discord bot is ready! 🤖',
    schedulerTick: (date: DateTime) => `Tick du scheduler du ${date.fullLocalDate(fr)} à ${date.toTimeString()}`,
    schedulerEndTick: 'Fin du tick',
    schedulerError: 'Scheduler error',
    sendingRemindersFor: (date: DateTime) => `Envoi des rappels pour le ${date.fullLocalDate(fr)}`,
    reminderChannel: 'Canal de rappel:',
    dailyPromptMessage: (time: string, userIds: string[], date: DateTime) =>
      `Il est ${time}. <@${userIds.join('> <@')}>, vous n'avez pas encore saisi vos pas du ${date.fullLocalDate(fr)} !\nCliquez sur le bouton ci-dessous pour enregistrer.`,
    dailyPromptMessageSingle: (time: string, userId: string, date: DateTime) =>
      `Il est ${time}. <@${userId}>, tu n'as pas encore saisi tes pas du ${date.fullLocalDate(fr)} !\nCliquez sur le bouton ci-dessous pour enregistrer.`,
    weeklySummarySendError: "Impossible d'envoyer le résumé pour",
    connected: 'Connecté',
    weeklySummaryMessage: (userId: string, monday: DateTime) =>
      `<@${userId}>, voici ton résumé pour la semaine du ${monday.fullLocalDate(fr)}.`
  },
  deploy: {
    start: 'Synchronisation complète des commandes (/)...',
    success: (count: number) => `Commandes synchronisées (${count}). ✅`,
    error: 'Erreur lors du déploiement des commandes'
  }
};

export const objectif = {
  command: {
    description: 'Afficher ou définir un objectif quotidien',
    optionUtilisateurDescription: 'Utilisateur cible (défaut: toi)'
  },
  modal: {
    title: 'Définir mon objectif',
    stepLabel: 'Objectif de pas par jour',
    stepPlaceholder: '8000'
  },
  replyAction: {
    noGoal: (userId: string) => `<@${userId}> a supprimé son objectif.`,
    noChange: "Tu n'as pas changé ton objectif.",
    goal: (userId: string, goal: number) => `<@${userId}> a un nouvel objectif de ${goal} pas par jour.`,
    invalidValue: 'valeur invalide: doit être un entier >= 0.'
  },
  replySelect: {
    noGoal: (userId: string) => `<@${userId}> n'a pas d'objectif.`,
    goal: (userId: string, goal: number) => `<@${userId}> a un objectif de ${goal} pas par jour.`
  }
};

export const saisir = {
  command: {
    description: 'Saisir les pas du jour via un formulaire.',
    optionJourDescription: "Date AAAA-MM-JJ (optionnel, défaut: aujourd'hui Europe/Paris)"
  },
  modal: {
    title: (date: DateTime) => `Saisir les pas pour ${date.fullLocalDate(fr)}`,
    stepLabel: 'Nombre de pas',
    stepPlaceholder: '7800'
  },
  ids: {
    buttonPrefix: 'saisir-btn-'
  },
  button: {
    label: 'Saisir ma journée'
  },
  replyAction: {
    invalidDate: 'Date invalide. Format attendu AAAA-MM-JJ.',
    entryDeleted: (userId: string, date: DateTime) =>
      `<@${userId}> a supprimé sa saisie pour le ${date.fullLocalDate(fr)}.`,
    noChange: (date: DateTime) => `Tu n'a pas changé ta saisie pour le ${date.fullLocalDate(fr)}.`,
    invalidValue: 'Valeur invalide: entrer un entier >= 0.',
    saved: (userId: string, date: DateTime) => `<@${userId}> a enregistré ses pas pour le ${date.fullLocalDate(fr)}.`
  },
  image: {
    dateTitle: (date: DateTime) => date.fullLocalDate(fr),
    streak: (days: number) => (days === 1 ? '1 jour' : `${days} jours`),
    reached: 'Félicitations, tu as atteint ton objectif.',
    remaining: (remaining: number) => `Il te reste ${remaining} pas pour atteindre ton objectif.`
  }
};

export const resumeSemaine = {
  command: {
    description: 'Afficher un résumé de la semaine (lundi->dimanche)',
    optionLundiDescription: 'Date du lundi (AAAA-MM-JJ) de la semaine à résumer (optionnel)'
  },
  embed: {
    title: 'Résumé hebdomadaire',
    fieldTotal: (steps: number) => `Total : ${steps} pas`,
    fieldAverage: (steps: number) => `Moyenne : ${steps} pas/jour`,
    fieldGoalReached: (count: number) =>
      count === 0
        ? 'Objectif atteint : aucun jour'
        : count === 1
          ? 'Objectif atteint : 1 jour'
          : `Objectif atteint : ${count} jours`,
    streak: (days: number) => (days === 1 ? 'Série : 1 jour' : `Série : ${days} jours`)
  },
  replyAction: {
    invalidMonday: 'Date du lundi invalide.',
    message: (userId: string, monday: DateTime) =>
      `<@${userId}>, voici ton résumé pour la semaine du ${monday.fullLocalDate(fr)}.`
  },
  image: {
    dayLetters: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    title: (monday: DateTime) =>
      `Semaine du ${monday.shortLocalDate(fr)} au ${monday.addDay(6).shortLocalDate(fr, true)}`
  }
};
