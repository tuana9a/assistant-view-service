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
    }
};

terminal.add_command({ bin: "set", execute: set, args: {} });
function set(args) {
    let key = args[1];
    let value = args[2];
    terminal.env_set(key, value);
}

terminal.add_command({ bin: "get", execute: get, args: {} });
function get(args) {
    let key = args[1];
    terminal.append_response(terminal.env_get(key));
}

terminal.add_command({ bin: "insert classes", execute: insert_classes, args: {} });
terminal.add_command({ bin: "upload classes", execute: insert_classes, args: {} });
function insert_classes(args) {
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
}

terminal.add_command({ bin: "delete classes", execute: delete_classes, args: {} });
function delete_classes(args) {
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
}

terminal.add_command({ bin: "upload todos.json", execute: upload_todos_json, args: {} });
function upload_todos_json(args) {
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
}

terminal.add_command({ bin: "env", execute: show_env, args: {} });
terminal.add_command({ bin: "environment", execute: show_env, args: {} });
function show_env(args) {
    terminal.append_response_json(terminal.env_get_all());
}

terminal.add_command({ bin: "AppConfig", execute: get_config_json, args: {} });
terminal.add_command({ bin: "app-config.json", execute: get_config_json, args: {} });
function get_config_json(args) {
    terminal.append_response_json(AppConfig);
}

terminal.add_command({ bin: "paths", execute: get_paths, args: {} });
function get_paths(args) {
    terminal.append_response_json(terminal.get_paths());
}

terminal.env_set("term", localStorage.getItem("term"));
terminal.execute("env");

httpClientService.ajax({ url: "/app-config.json", method: "GET" }, (data) => (AppConfig = data));

window.addEventListener("drop", (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    terminal.env_set("file", file);
    terminal.append_response("drop: " + file.name);
});
window.addEventListener("dragover", (e) => e.preventDefault());
