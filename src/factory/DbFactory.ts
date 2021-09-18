import { MongoClient } from "mongodb";

let mongoClient: MongoClient;

class DbFactory {
    async init(connection_string: string) {
        mongoClient = new MongoClient(connection_string);
        await mongoClient.connect();
        await mongoClient.db("test").command({ ping: 1 }); // Establish and verify connection
    }
    mongoClient() {
        return mongoClient;
    }
    db(name: string) {
        return mongoClient.db(name);
    }
}

export const dbFactory = new DbFactory();
