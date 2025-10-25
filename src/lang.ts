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
		saved: (userId: string, dateISO: string) => `<@${userId}> a enregistré ses pas pour le ${formatDate(dateISO)}.`,
	},
	image: {
		dateTitle: (dateISO: string) => formatDate(dateISO),
		streak: (days: number) => (days === 1 ? '1 jour' : `${days} jours`),
		reached: 'Félicitations, tu as atteint ton objectif.',
		remaining: (remaining: number) => `Il te reste ${remaining} pas pour atteindre ton objectif.`,
	}
};

export const resumeSemaine = {
	command: {
		description: 'Afficher un résumé de la semaine (lundi->dimanche)',
		optionLundiDescription: 'Date du lundi (AAAA-MM-JJ) de la semaine à résumer (optionnel)',
	},
	embed: {
		title: 'Résumé hebdomadaire',
		fieldTotal: (steps: number) => `Total : ${steps} pas`,
		fieldAverage: (steps: number) => `Moyenne : ${steps} pas/jour`,
		fieldGoalReached: (count: number) => (count === 0 ? 'Objectif atteint : aucun jour' : count === 1 ? 'Objectif atteint : 1 jour' : `Objectif atteint : ${count} jours`),
		streak: (days: number) => (days === 1 ? 'Série : 1 jour' : `Série : ${days} jours`),
	},
	replyAction: {
		invalidMonday: 'Date du lundi invalide.',
	},
	image: {
		dayLetters: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
		title: (mondayISO: string) => {
			const d = new Date(mondayISO);
			if (isNaN(d.getTime())) return 'Semaine';
			const sunday = new Date(d);
			sunday.setDate(d.getDate() + 6);
			const fmt = (x: Date, withYear = false) => x.toLocaleDateString('fr-FR', {
				day: 'numeric', month: 'long', ...(withYear ? {year: 'numeric'} : {})
			});
			return `Semaine de ${fmt(d)} au ${fmt(sunday, true)}`;
		}
	}
};
