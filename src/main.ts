import fs from "fs";
import cors from "cors";
import http from "http";
import https from "https";
import express from "express";

import { AppConfig } from "./config/AppConfig";

const server = express();

if (AppConfig.security.cors) {
    server.use(cors());
}
server.use(express.json());
server.use(express.static("./webapp"));

let port = process.env.PORT || AppConfig.listen_port;
if (AppConfig.security.ssl) {
    const key = fs.readFileSync(AppConfig.security.key_file);
    const cert = fs.readFileSync(AppConfig.security.cert_file);
    https.createServer({ key, cert }, server).listen(port);
} else {
    http.createServer(server).listen(port);
}
console.log(` * listen: ${port} (${AppConfig.security.ssl ? "https" : "http"})`);
