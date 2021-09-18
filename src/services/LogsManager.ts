import { AppConfig } from "../config/AppConfig";
import { dbFactory } from "../factory/DbFactory";

class LogsManager {
    async findMany(collection = "general", filter = {}) {
        const db = dbFactory.db("logs");
        let result = await db.collection(collection).find(filter).limit(AppConfig.database.read_limit).toArray();
        return result;
    }
}

export const logsManager = new LogsManager();
