'use strict';

import { AppConfig } from './app.js';
import { terminal } from './terminal.js';
import { httpClientService } from './common.js';

terminal.add_command({ bin: 'insert classes', execute: insert_classes, args: {} });
function insert_classes(...args) {
    let term = args[2] || terminal.get('term');
    let file = terminal.get('file');
    httpClientService.uploadFile(
        { url: AppConfig.apps.app2.address + `/api/insert/many/lop-dang-ky?term=${term}` },
        file,
        terminal.append_response_json
    );
    return `insert classes ${term}`;
}

terminal.add_command({ bin: 'delete classes', execute: delete_classes, args: {} });
function delete_classes(...args) {
    let term = args[2] || terminal.get('term');
    httpClientService.ajax(
        {
            url: AppConfig.apps.app2.address + '/api/delete/many/lop-dang-ky?term=' + term,
            method: 'DELETE'
        },
        terminal.append_response_json
    );
    return `delete classes ${term}`;
}
