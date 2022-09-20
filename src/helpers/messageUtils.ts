import config, { Message } from "../config.js";
import { randomUUID } from "crypto";


export const isMessageFrozen = (message: Message): boolean => {
    const now = new Date();
    const frozenTo = new Date(message.frozenTo);
    return now < frozenTo;
}

export const freezeMessage = (message: Message): Message => {
    const freezeTime = config.messageFreezeTimeMinutes * 60000
    message.frozenTo = new Date(new Date().getTime() + freezeTime);
    return message;
}

export const unfreezeMessage = (message: Message): Message => {
    message.frozenTo = new Date(0);
    return message;
}

export const newMessage = (key: string, value: string): Message => {
    const newId = randomUUID();
    return {
        _id: newId,
        key,
        value,
        frozenTo: new Date(0)
    }
}

