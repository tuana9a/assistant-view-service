"use strict";

import { terminal } from "./terminal.js";
import { httpClientService } from "./common.js";

let AppConfig = {
    apps: {
        app2: {
            name: "",
            address: ""
        },
        app3: {
            name: "",
            address: ""
        }
    },
    version: "v2019.7",
    service_worker_file: "app.service-worker.js"
};
httpClientService.ajax({ url: "/app-config.json", method: "GET" }, (data) => (AppConfig = data));

terminal.add_command({ bin: "set", execute: set, args: {} });
function set(...args) {
    let key = args[1];
    let value = args[2];
    let sucess = terminal.env_set(key, value);
    return `set ${key}=${value} sucess:${sucess}`;
}

terminal.add_command({ bin: "get", execute: get, args: {} });
function get(...args) {
    let key = args[1];
    terminal.append_response(terminal.env_get(key));
    return "";
}

terminal.add_command({ bin: "insert classes", execute: insert_classes, args: {} });
function insert_classes(...args) {
    let term = args[2] || terminal.env_get("term");
    let file = terminal.env_get("file");
    httpClientService.uploadFile(
        {
            url: AppConfig.apps.app2.address + `/api/insert/many/lop-dang-ky?term=${term}`,
            headers: {
                authorization: terminal.env_get("secret")
            }
        },
        file,
        terminal.append_response_json
    );
    return `insert classes ${term} ${file.name}`;
}

terminal.add_command({ bin: "delete classes", execute: delete_classes, args: {} });
function delete_classes(...args) {
    let term = args[2] || terminal.env_get("term");
    httpClientService.ajax(
        {
            url: AppConfig.apps.app2.address + "/api/delete/many/lop-dang-ky?term=" + term,
            method: "POST",
            headers: {
                authorization: terminal.env_get("secret")
            }
        },
        terminal.append_response_json
    );
    return `delete classes ${term}`;
}

terminal.add_command({ bin: "upload todos.json", execute: upload_todos_json, args: {} });
function upload_todos_json(...args) {
    let file = terminal.env_get("file");
    httpClientService.uploadFile(
        {
            url: AppConfig.apps.app3.address + "/api/upload/todos.json",
            headers: {
                authorization: terminal.env_get("secret")
            }
        },
        file,
        terminal.append_response_json
    );
    return `upload todos.json file=${file.name}`;
}

terminal.add_command({ bin: "show env", execute: show_env, args: {} });
function show_env(...args) {
    terminal.append_response_json(terminal.env_get_all());
    return `show env`;
}

terminal.env_set("term", localStorage.getItem("term"));
show_env();

window.addEventListener("drop", (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    terminal.env_set("file", file);
    terminal.append_response("drop: " + file.name);
});
window.addEventListener("dragover", (e) => e.preventDefault());
