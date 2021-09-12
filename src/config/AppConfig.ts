import fs from "fs";

var config = {
    listen_port: 80,
    security: {
        cors: false,
        ssl: false,
        cert_file: "",
        key_file: ""
    }
};
config = JSON.parse(fs.readFileSync("resource/app-config.json", { flag: "r", encoding: "utf-8" }));

export const AppConfig = config;
