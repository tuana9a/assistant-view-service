import fs from "fs";

var config = {
    server: {
        port: -1
    },
    security: {
        secret: "",
        ssl: false
    },
    path: {
        resource_dir: "resource/",
        logs_dir: "logs/"
    }
};
config = JSON.parse(fs.readFileSync("resource/app-config.json", { flag: "r", encoding: "utf-8" }));

export const AppConfig = config;
