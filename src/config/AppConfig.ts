import fs from "fs";

var config = {
    listen_port: 80,
    log_enabled: false,
    log_destination: "",
    security: {
        cors: false,
        ssl: false,
        secret: "",
        cert_file: "",
        key_file: ""
    },
    database: {
        connection_string: "",
        read_limit: 1,
        batch_size: 1
    }
};
config = JSON.parse(fs.readFileSync("resource/app-config.json", { flag: "r", encoding: "utf-8" }));

export const AppConfig = config;
