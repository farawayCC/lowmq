import config, { Message } from "../config.js";
import { randomUUID } from "crypto";


export const isMessageFrozen = (message: Message): boolean => {
    const now = new Date();
    const frozenTo = new Date(message.frozenTo);
    return now < frozenTo;
}

export const freezeMessage = (message: Message): Message => {
    var freezeTime = message.freezeTime * 60_000;
    freezeTime = Math.max(freezeTime, 1) // 1 min minimum
    freezeTime = Math.min(freezeTime, 60) // 1 hour maximum
    message.frozenTo = new Date(new Date().getTime() + freezeTime);
    return message;
}

export const unfreezeMessage = (message: Message): Message => {
    message.frozenTo = new Date(0);
    return message;
}

export const newMessage = (key: string, value: string, freezeTime: number): Message => {
    const newId = randomUUID();
    return {
        _id: newId,
        key,
        value,
        frozenTo: new Date(0),
        freezeTime
    }
}

