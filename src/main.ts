import fs from "fs";
import cors from "cors";
import http from "http";
import https from "https";
import express from "express";

import { AppConfig } from "./config/AppConfig";
import { requestFilter } from "./security/RequestFilter";

const server = express();
const credentials = { key: fs.readFileSync("resource/key.pem"), cert: fs.readFileSync("resource/cert.pem") };

server.use(cors());
server.use(express.json());
server.use(express.static("./webapp"));

let port = process.env.PORT || AppConfig.server.port;
if (AppConfig.security.ssl) {
    https.createServer(credentials, server).listen(port);
} else {
    http.createServer(server).listen(port);
}
console.log(` * listen: ${port} (${AppConfig.security.ssl ? "https" : "http"})`);
