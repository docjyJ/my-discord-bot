import type {InteractionCallbackResponse, InteractionResponse, ModalSubmitInteraction} from 'discord.js';
import objectif from './objectif';
import saisir from './saisir';

export const getObjectiveModal = objectif.getModal;
export const getSaisirModal = saisir.getModal;

export const modalsExecutor: Partial<Record<string, (interaction: ModalSubmitInteraction, args: string[]) => Promise<InteractionResponse | InteractionCallbackResponse>>> = {
  [objectif.modalId]: objectif.executor,
  [saisir.modalId]: saisir.executor
};
