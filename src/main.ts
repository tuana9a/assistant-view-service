import cors from "cors";
import express from "express";

import { AppConfig } from "./config/AppConfig";
import { requestFilter } from "./security/RequestFilter";

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.static("./webapp"));

let port = process.env.PORT || AppConfig.server.port;
server.listen(port).on("error", console.error);
console.log(` * listen: ${AppConfig.server.address}`);
