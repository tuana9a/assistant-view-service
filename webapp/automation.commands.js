'use strict';

import { AppConfig } from './app.js';
import { httpClientService } from './common.js';
import { terminal } from './terminal.js';

terminal.add_command({ bin: 'upload todos.json', execute: upload_todos_json, args: {} });
function upload_todos_json(...args) {
    let file = terminal.get('file');
    httpClientService.uploadFile(
        { url: AppConfig.worker_config.service3.address + '/api/admin/todos.json' },
        file,
        terminal.append_response_json
    );
    return `upload todos.json: ${file}`;
}
