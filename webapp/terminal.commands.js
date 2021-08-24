'use strict';

import { terminal } from './terminal.js';
import { httpClientService } from './common.js';
import { AppConfig } from './app.js';

terminal.add_command({ bin: 'set', execute: set, args: {} });
function set(...args) {
    let key = args[1];
    let value = args[2];
    let sucess = terminal.set(key, value);
    terminal.show_env_variables();
    return `set ${key}=${value} sucess:${sucess}`;
}

terminal.add_command({ bin: 'get', execute: get, args: {} });
function get(...args) {
    let key = args[1];
    terminal.append_response(terminal.get(key));
    return '';
}

terminal.add_command({ bin: 'insert classes', execute: insert_classes, args: {} });
function insert_classes(...args) {
    let term = args[2] || terminal.get('term');
    let file = terminal.get('file');
    httpClientService.uploadFile(
        {
            url: AppConfig.apps.app2.address + `/api/insert/many/lop-dang-ky?term=${term}`,
            headers: {
                authorization: terminal.get('secret')
            }
        },
        file,
        terminal.append_response_json
    );
    return `insert classes ${term} ${JSON.stringify(file)}`;
}

terminal.add_command({ bin: 'delete classes', execute: delete_classes, args: {} });
function delete_classes(...args) {
    let term = args[2] || terminal.get('term');
    httpClientService.ajax(
        {
            url: AppConfig.apps.app2.address + '/api/delete/many/lop-dang-ky?term=' + term,
            method: 'POST',
            headers: {
                authorization: terminal.get('secret')
            }
        },
        terminal.append_response_json
    );
    return `delete classes ${term}`;
}

// automation
terminal.add_command({ bin: 'upload todos.json', execute: upload_todos_json, args: {} });
function upload_todos_json(...args) {
    let file = terminal.get('file');
    httpClientService.uploadFile(
        {
            url: AppConfig.apps.app3.address + '/api/admin/todos.json',
            headers: {
                authorization: terminal.get('secret')
            }
        },
        file,
        terminal.append_response_json
    );
    return `upload todos.json: ${JSON.stringify(file)}`;
}
