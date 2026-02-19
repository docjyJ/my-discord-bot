import type DateTime from './date-time';

const fr = 'fr-FR';
const nbFmt = new Intl.NumberFormat(fr);

export const lang = {
  scheduler: {
    ready: 'Discord bot is ready! 🤖',
    schedulerTick: (date: DateTime) => `Tick du scheduler du ${date.fullLocalDate(fr)} à ${date.toTimeString()}`,
    schedulerEndTick: 'Fin du tick',
    schedulerError: 'Scheduler error',
    sendingRemindersFor: (date: DateTime) => `Envoi des rappels pour le ${date.fullLocalDate(fr)}`,
    reminderChannel: 'Canal de rappel:',
    dailyPromptMessage: (userIds: string[], date: DateTime) =>
      `La journée est finie ! <@${userIds.join('> <@')}>, vous n'avez pas encore saisi vos pas du ${date.fullLocalDate(fr)} !\nCliquez sur le bouton ci-dessous pour enregistrer.`,
    dailyPromptMessageSingle: (userId: string, date: DateTime) =>
      `La journée est finie ! <@${userId}>, tu n'as pas encore saisi tes pas du ${date.fullLocalDate(fr)} !\nCliquez sur le bouton ci-dessous pour enregistrer.`,
    weeklySummarySendError: "Impossible d'envoyer le résumé pour",
    connected: 'Connecté',
    weeklySummaryMessage: (userId: string, monday: DateTime) => `<@${userId}>, voici ton résumé pour la semaine du ${monday.fullLocalDate(fr)}.`,
    monthlySummaryMessage: (userId: string, firstDay: DateTime) => {
      const label = capitalizeFirst(firstDay.monthLocalName(fr));
      return `<@${userId}>, voici ton résumé pour le mois de ${label}.`;
    },
    monthlySummarySendError: "Impossible d'envoyer le résumé mensuel pour",
    weeklySummaryTriggered: (date: DateTime) => `Résumé hebdomadaire déclenché pour la semaine du ${date.fullLocalDate(fr)}.`,
    monthlySummaryTriggered: (date: DateTime) => {
      const label = capitalizeFirst(date.monthLocalName(fr));
      return `Résumé mensuel déclenché pour le mois de ${label}.`;
    }
  },
  deploy: {
    start: 'Synchronisation complète des commandes (/)...',
    success: (count: number) => `Commandes synchronisées (${nbFmt.format(count)}). ✅`,
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
    dailyGoal: (userId: string, goal: number) => `<@${userId}> a un nouvel objectif de ${nbFmt.format(goal)} pas par jour.`,
    weeklyGoal: (userId: string, goal: number) => `<@${userId}> a un nouvel objectif de ${nbFmt.format(goal)} pas par semaine.`,
    invalidValue: 'valeur invalide: doit être un entier >= 0.'
  },
  replySelect: {
    noGoal: (userId: string) => `<@${userId}> n'a pas d'objectif.`,
    goals: (userId: string, dailyGoal: number | null, weeklyGoal: number | null) => {
      const parts: string[] = [];
      if (dailyGoal !== null) parts.push(`un objectif de ${nbFmt.format(dailyGoal)} pas par jour`);
      if (weeklyGoal !== null) parts.push(`un objectif de ${nbFmt.format(weeklyGoal)} pas par semaine`);
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
    saved: (userId: string, date: DateTime) => `<@${userId}> a enregistré ses pas pour le ${date.fullLocalDate(fr)}.`,
    summaryWeek: 'De plus voici son résumé de la semaine.',
    summaryMonth: 'De plus voici son résumé du mois.',
    summaryWeekMonth: 'De plus voici son résumé de la semaine et du mois.'
  },
  image: {
    dateTitle: (date: DateTime) => date.fullLocalDate(fr),
    streak: (days: number) => (days === 1 ? '1 jour' : `${nbFmt.format(days)} jours`),
    reached: 'Félicitations, tu as atteint ton objectif.',
    weeklyGoalSuccess: 'Félicitation tu as atteint ton objectif hebdomadaire',
    dailyGoalSuccess: 'Félicitation tu as réussi ton objectif journalier',
    allGoalSuccess: 'Félicitation tu as réussi ton objectif journalier et hebdomadaire'
  }
};

export const resumeSemaine = {
  command: {
    description: 'Afficher un résumé de la semaine (lundi->dimanche)',
    optionLundiDescription: 'Date du lundi (AAAA-MM-JJ) de la semaine à résumer (optionnel)'
  },
  embed: {
    title: 'Résumé hebdomadaire',
    fieldDaysEntered: (days: number) => (days === 1 ? 'Total saisis : 1 jour' : `Total saisis : ${nbFmt.format(days)} jours`),
    fieldDaysSucceeded: (days: number) => (days === 1 ? 'Total réussis : 1 jour' : `Total réussis : ${nbFmt.format(days)} jours`),
    fieldBestStreak: (days: number) => (days === 1 ? 'Meilleure série : 1 jour' : `Meilleure série : ${nbFmt.format(days)} jours`)
  },
  replyAction: {
    invalidMonday: 'Date du lundi invalide.',
    message: (userId: string, monday: DateTime) => `<@${userId}>, voici ton résumé pour la semaine du ${monday.fullLocalDate(fr)}.`
  },
  image: {
    dayLetters: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    title: (monday: DateTime) => `Semaine du ${monday.shortLocalDate(fr)} au ${monday.addDay(6).shortLocalDate(fr, true)}`,
    barLabel: (total: number, average: number) => `${nbFmt.format(total)} - Soit : ${nbFmt.format(average)} par jour`
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
    fieldDaysEntered: (days: number) => (days === 1 ? 'Total saisis : 1 jour' : `Total saisis : ${nbFmt.format(days)} jours`),
    fieldDaysSucceeded: (days: number) => (days === 1 ? 'Total réussis : 1 jour' : `Total réussis : ${nbFmt.format(days)} jours`),
    fieldBestStreak: (days: number) => (days === 1 ? 'Meilleure série : 1 jour' : `Meilleure série : ${nbFmt.format(days)} jours`)
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
