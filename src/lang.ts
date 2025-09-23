function formatDate(date: string): string {
	const d = new Date(date);
	if (isNaN(d.getTime())) return 'Date invalide';
	return d.toLocaleDateString('fr-FR', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});
}

export const lang = {
	scheduler: {
		ready: 'Discord bot is ready! 🤖',
		schedulerTick: 'Scheduler tick',
		schedulerEndTick: 'Fin du tick',
		schedulerError: 'Scheduler error',
		sendingRemindersFor: 'Envoi des rappels pour',
		reminderChannel: 'Canal de rappel:',
		dailyPromptMessage: (time: string, userIds: string[], dateISO: string) =>
			`Il est ${time}. <@${userIds.join('> <@')}>, vous n'avez pas encore saisi vos pas du ${formatDate(dateISO)} !\nCliquez sur le bouton ci-dessous pour enregistrer.`,
		dailyPromptMessageSingle: (time: string, userId: string, dateISO: string) =>
			`Il est ${time}. <@${userId}>, tu n'as pas encore saisi tes pas du ${formatDate(dateISO)} !\nCliquez sur le bouton ci-dessous pour enregistrer.`,
		weeklySummarySendError: "Impossible d'envoyer le résumé pour",
		connected: 'Connecté',
	},
	deploy: {
		start: 'Synchronisation complète des commandes (/)...',
		success: (count: number) => `Commandes synchronisées (${count}). ✅`,
		error: 'Erreur lors du déploiement des commandes',
	},
};

export const objectif = {
	command: {
		description: 'Afficher ou définir un objectif quotidien',
		optionUtilisateurDescription: 'Utilisateur cible (défaut: toi)',
	},
	modal: {
		title: 'Définir mon objectif',
		stepLabel: 'Objectif de pas par jour',
		stepPlaceholder: '8000',
	},
	ids: {
		modalId: 'objectif-modal',
	},
	replyAction: {
		noGoal: (userId: string) => `<@${userId}> a supprimé son objectif.`,
		noChange: 'Tu n\'as pas changé ton objectif.',
		goal: (userId: string, goal: number) => `<@${userId}> a un nouvel objectif de ${goal} pas par jour.`,
		invalidValue: 'valeur invalide: doit être un entier >= 0.',
	},
	replySelect: {
		noGoal: (userId: string) => `<@${userId}> n'a pas d'objectif.`,
		goal: (userId: string, goal: number) => `<@${userId}> a un objectif de ${goal} pas par jour.`,
	}
};

export const saisir = {
	command: {
		description: 'Saisir les pas du jour via un formulaire.',
		optionJourDescription: "Date AAAA-MM-JJ (optionnel, défaut: aujourd'hui Europe/Paris)",
	},
	modal: {
		title: (dateISO: string) => `Saisir les pas pour ${formatDate(dateISO)}`,
		stepLabel: 'Nombre de pas',
		stepPlaceholder: '7800',
	},
	ids: {
		modalPrefix: 'saisir-modal-',
		buttonPrefix: 'saisir-btn-',
	},
	button: {
		label: 'Saisir ma journée',
	},
	replyAction: {
		invalidDate: 'Date invalide. Format attendu AAAA-MM-JJ.',
		entryDeleted: (userId: string, dateISO: string) => `<@${userId}> a supprimé sa saisie pour le ${formatDate(dateISO)}.`,
		noChange: (dateISO: string) => `Tu n'a pas changé ta saisie pour le ${formatDate(dateISO)}.`,
		invalidValue: 'Valeur invalide: entrer un entier >= 0.',
		saved: (userId: string, dateISO: string, step: number) => `<@${userId}> a fait ${step} pas le ${formatDate(dateISO)}. Félicitations !`,
		savedReached: (userId: string, dateISO: string, objective:number, step: number) => `<@${userId}> a fait ${step} pas le ${formatDate(dateISO)}, Tu as atteint ton objectif de ${objective} pas, félicitations !`,
		savedRemaining: (userId: string, dateISO: string, objective:number, step: number, missing: number) => `<@${userId}> a fait ${step} pas le ${formatDate(dateISO)}. Il te manque ${missing} pas pour atteindre ton objectif de ${objective} pas. Allez, tu peux le faire !`,
	},
};

export const resumeSemaine = {
	command: {
		description: 'Afficher un résumé de la semaine (lundi->dimanche)',
		optionLundiDescription: 'Date du lundi (AAAA-MM-JJ) de la semaine à résumer (optionnel)',
	},
	text: {
		header: (mondayISO: string, endISO: string) => `Semaine ${mondayISO} → ${endISO}`,
		goalLine: (goal: number) => `Objectif: = ${goal} pas/jour`,
	},
	embed: {
		title: 'Résumé hebdomadaire',
		fieldTotal: 'Total',
		fieldAverage: 'Moyenne',
		fieldGoalReached: 'Objectif atteint',
	},
	replyAction: {
		invalidMonday: 'Date du lundi invalide.',
	}
};
