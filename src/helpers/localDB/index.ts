// const lowdb = import('lowdb')
import { JSONFileSync, LowSync } from 'lowdb'
import config, { Message } from '../../config.js';


export type DB = {
    read: () => void
    write: () => void
    data: Data | null
}

export type Data = {
    messages: {
        [key in string]: Message[]
    }
}

const initLowDB = (): DB => {
    const adapter = new JSONFileSync<Data>(config.dbFilePath)
    const db = new LowSync(adapter)
    db.read()
    if (!db.data)
        db.data = { messages: {} }
    return db
}

export const clearDB = async (db: DB) => {
    if (db.data)
        db.data.messages = {}
    await db.write()
}


export default class LowDB {
    private static instance: LowDB;
    private db: DB;

    private constructor() {
        this.db = initLowDB()
    }

    public static getDB(): DB {
        if (!LowDB.instance)
            LowDB.instance = new LowDB();

        return LowDB.instance.db;
    }
}