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
    weeklySummaryMessage: (userId: string, monday: DateTime) => `<@${userId}>, voici ton résumé pour la semaine du ${monday.fullLocalDate(fr)}.`,
    monthlySummaryMessage: (userId: string, firstDay: DateTime) => {
      const label = capitalizeFirst(firstDay.monthLocalName(fr));
      return `<@${userId}>, voici ton résumé pour le mois de ${label}.`;
    },
    monthlySummarySendError: "Impossible d'envoyer le résumé mensuel pour"
  },
  deploy: {
    start: 'Synchronisation complète des commandes (/)...',
    success: (count: number) => `Commandes synchronisées (${count}). ✅`,
    error: 'Erreur lors du déploiement des commandes'
  }
};

export const objectif = {
  command: {
    description: 'Afficher ou définir un objectif quotidien et/ou hebdomadaire',
    optionUtilisateurDescription: 'Utilisateur cible (défaut: toi)'
  },
  modal: {
    title: 'Définir mes objectifs',
    stepLabel: 'Objectif de pas par jour',
    stepPlaceholder: '8000',
    weeklyStepLabel: 'Objectif de pas par semaine',
    weeklyStepPlaceholder: '70000'
  },
  replyAction: {
    noDailyGoal: (userId: string) => `<@${userId}> a supprimé son objectif quotidien.`,
    noWeeklyGoal: (userId: string) => `<@${userId}> a supprimé son objectif hebdomadaire.`,
    noChange: "Tu n'as pas changé tes objectifs.",
    dailyGoal: (userId: string, goal: number) => `<@${userId}> a un nouvel objectif de ${goal} pas par jour.`,
    weeklyGoal: (userId: string, goal: number) => `<@${userId}> a un nouvel objectif de ${goal} pas par semaine.`,
    invalidValue: 'valeur invalide: doit être un entier >= 0.'
  },
  replySelect: {
    noGoal: (userId: string) => `<@${userId}> n'a pas d'objectif.`,
    goals: (userId: string, dailyGoal: number | null, weeklyGoal: number | null) => {
      const parts: string[] = [];
      if (dailyGoal !== null) parts.push(`objectif de ${dailyGoal} pas par jour`);
      if (weeklyGoal !== null) parts.push(`objectif de ${weeklyGoal} pas par semaine`);
      return `<@${userId}> a ${parts.join(' et ')}.`;
    }
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
    entryDeleted: (userId: string, date: DateTime) => `<@${userId}> a supprimé sa saisie pour le ${date.fullLocalDate(fr)}.`,
    noChange: (date: DateTime) => `Tu n'a pas changé ta saisie pour le ${date.fullLocalDate(fr)}.`,
    invalidValue: 'Valeur invalide: entrer un entier >= 0.',
    saved: (userId: string, date: DateTime) => `<@${userId}> a enregistré ses pas pour le ${date.fullLocalDate(fr)}.`
  },
  image: {
    dateTitle: (date: DateTime) => date.fullLocalDate(fr),
    streak: (days: number) => (days === 1 ? '1 jour' : `${days} jours`),
    reached: 'Félicitations, tu as atteint ton objectif.',
    remaining: (remaining: number) => `Il te reste ${remaining} pas pour atteindre ton objectif.`,
    weekly: {
      message1: (remaining: number, perDay: number) => `Il te reste ${remaining} pas (soit ${perDay} par jour) pour réussir ton objectif hebdomadaire.`,
      message2: (remaining: number) => `Il te reste ${remaining} pas pour réussir ton objectif hebdomadaire.`,
      message3: 'Félicitation tu a atein ton objectif hebdomadaire',
      message4: 'Félicitation tu as réussi ton objectif journalier',
      message5: (remaining: number) => `Félicitation tu as réussi ton objectif journalier.\nIl te reste ${remaining} pas pour réussir ton objectif hebdomadaire.`,
      message6: (remaining: number, perDay: number) =>
        `Félicitation tu as réussi ton objectif journalier.\nIl te reste ${remaining} pas (soit ${perDay} par jour) pour réussir ton objectif hebdomadaire.`,
      message7: 'Félicitation tu as réussi ton objectif journalier et hebdomadaire'
    }
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
    fieldDaysEntered: (days: number) => (days === 1 ? 'Total saisis : 1 jour' : `Total saisis : ${days} jours`),
    fieldDaysSucceeded: (days: number) => (days === 1 ? 'Total réussis : 1 jour' : `Total réussis : ${days} jours`),
    fieldBestStreak: (days: number) => (days === 1 ? 'Meilleure série : 1 jour' : `Meilleure série : ${days} jours`)
  },
  replyAction: {
    invalidMonday: 'Date du lundi invalide.',
    message: (userId: string, monday: DateTime) => `<@${userId}>, voici ton résumé pour la semaine du ${monday.fullLocalDate(fr)}.`
  },
  image: {
    dayLetters: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    title: (monday: DateTime) => `Semaine du ${monday.shortLocalDate(fr)} au ${monday.addDay(6).shortLocalDate(fr, true)}`
  }
};

export const resumeMois = {
  command: {
    description: 'Afficher un résumé du mois',
    optionMoisDescription: 'Date (AAAA-MM-JJ) du mois à résumer (optionnel)'
  },
  embed: {
    title: 'Résumé mensuel',
    fieldTotal: (steps: number) => `Total : ${steps} pas`,
    fieldAverage: (steps: number) => `Moyenne : ${steps} pas/jour`,
    fieldDaysEntered: (days: number) => (days === 1 ? 'Total saisis : 1 jour' : `Total saisis : ${days} jours`),
    fieldDaysSucceeded: (days: number) => (days === 1 ? 'Total réussis : 1 jour' : `Total réussis : ${days} jours`),
    fieldBestStreak: (days: number) => (days === 1 ? 'Meilleure série : 1 jour' : `Meilleure série : ${days} jours`)
  },
  replyAction: {
    invalidDate: 'Date invalide.',
    message: (userId: string, date: DateTime) => `<@${userId}>, voici ton résumé pour le mois de ${capitalizeFirst(date.monthLocalName(fr))}.`
  },
  image: {
    dayLetters: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    title: (date: DateTime) => capitalizeFirst(date.monthLocalName(fr))
  }
};

function capitalizeFirst(str: string) {
  return str.length === 0 ? str : str[0].toUpperCase() + str.slice(1);
}
