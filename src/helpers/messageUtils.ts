import config, { Message } from "../config.js";


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
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return {
        //TODO: make sure this is unique
        _id: newId,
        key,
        value,
        frozenTo: new Date(0)
    }
}

