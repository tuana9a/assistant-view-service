import fs from "fs";
import cors from "cors";
import http from "http";
import https from "https";
import express from "express";

import { views } from "./views";
import { AppConfig } from "./config/AppConfig";
import { dbFactory } from "./factory/DbFactory";
import { requestFilter } from "./security/RequestFilter";

const server = express();

if (AppConfig.security.cors) {
    server.use(cors());
}
server.use(express.json());
server.use(express.static("./webapp"));

server.post("/api/find/many/logs", requestFilter.adminFilter);
server.post("/api/find/many/logs", views.findManyLogs);

async function main() {
    if (AppConfig.log_enabled && AppConfig.log_destination == "db") {
        console.log(" * database: " + AppConfig.database.connection_string);
        await dbFactory.init(AppConfig.database.connection_string);
    }

    let port = process.env.PORT || AppConfig.listen_port;
    if (AppConfig.security.ssl) {
        const key = fs.readFileSync(AppConfig.security.key_file);
        const cert = fs.readFileSync(AppConfig.security.cert_file);
        https.createServer({ key, cert }, server).listen(port);
    } else {
        http.createServer(server).listen(port);
    }
    console.log(` * listen: ${port} (${AppConfig.security.ssl ? "https" : "http"})`);
}

main();
