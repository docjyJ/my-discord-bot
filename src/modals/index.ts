import objectif from "./objectif";
import saisir from "./saisir";
import {InteractionCallbackResponse, InteractionResponse, ModalSubmitInteraction} from "discord.js";

export const getObjectiveModal = objectif.getModal;
export const getSaisirModal = saisir.getModal;

export const modalsExecutor: Partial<Record<string, (interaction: ModalSubmitInteraction, args: string[]) => Promise<InteractionResponse | InteractionCallbackResponse>>> = {
	[objectif.modalId]: objectif.executor,
	[saisir.modalId]: saisir.executor,
}