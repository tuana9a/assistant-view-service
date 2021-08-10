'use strict';

import { AppConfig } from './app.js';
import { httpClientService } from './common.js';
import { terminal, TERMINAL_GLOBAL_VARIABLES } from './terminal.js';

class CommandUtils {
    validateFile(file, extension) {
        if (!file || !file.name || !file.name.match) {
            // console.log(file);
            terminal.append_response('bad file');
            return false;
        } else if (!file.name.match(new RegExp(`^.+\.${extension}$`))) {
            terminal.append_response('require .' + extension);
            return false;
        }
        return true;
    }
}
const commandUtils = new CommandUtils();

//SECTION: default terminal command
terminal.add_command('set', set, { name: { type: 'string' }, value: { type: 'any' } });
function set(name, value) {
    let response = '';
    if (name == 'file') {
        response = "can't not add file by command, do drag'n'drop instead";
    } else {
        TERMINAL_GLOBAL_VARIABLES[`${name}`] = value;
        response = `set ${name}=${value} success`;
    }
    terminal.append_response(response);
    terminal.show_global_variables();
}
terminal.add_command('get', get, { name: { type: 'string' } });
function get(name) {
    let response = '';
    if (name == 'file') {
        response = TERMINAL_GLOBAL_VARIABLES.file.name;
    } else {
        response = TERMINAL_GLOBAL_VARIABLES[`${name}`];
    }
    terminal.append_response(response);
}
terminal.add_command('help', help, { '...any': { type: '...any' } });
function help() {
    let tree = Array.from(arguments)
        .reduce((total, each) => total + (each ? each : '') + ' ', '')
        .trim();
    let command = terminal.get_command(tree);
    terminal.append_response_json(command);
}

//SECTION: OTHER
terminal.add_command('get terms.json', get_term_json, {});
function get_term_json() {
    let url = '/terms.json';
    return httpClientService.ajax({ url: url, method: 'GET' }, terminal.append_response_json);
}

//SECTION: SCHOOL AUTOMATE
terminal.add_command('upload todos.json', upload_todos_json, { file: { type: 'file' } }, { timeout: 5000 });
function upload_todos_json(file) {
    if (!commandUtils.validateFile(file, 'json')) return;
    let url = AppConfig.worker_config.service3.address + '/api/admin/todos.json';
    return httpClientService.uploadFile({ url: url }, file, terminal.append_response_json);
}

//SECTION: REGISTER PREVIEW
terminal.add_command('update classes', update_classes, { term: { type: 'string' }, file: { type: 'file' } }, { timeout: 5000 });
function update_classes(term, file) {
    if (!commandUtils.validateFile(file, 'csv')) return;
    let url = AppConfig.worker_config.service2.address + `/api/admin/classes?term=${term}`;
    return httpClientService.uploadFile({ url: url }, file, terminal.append_response_json);
}
terminal.add_command('update classes-mid-exam', update_classes_mid_exam, { term: { type: 'string' }, file: { type: 'file' } }, { timeout: 5000 });
function update_classes_mid_exam(term, file) {
    if (!commandUtils.validateFile(file, 'csv')) return;
    let url = AppConfig.worker_config.service2.address + `/api/admin/classes/mid-exam?term=${term}`;
    return httpClientService.uploadFile({ url: url }, file, terminal.append_response_json);
}
terminal.add_command('update classes-end-exam', update_classes_end_exam, { term: { type: 'string' }, file: { type: 'file' } }, { timeout: 5000 });
function update_classes_end_exam(term, file) {
    if (!commandUtils.validateFile(file, 'csv')) return;
    let url = AppConfig.worker_config.service2.address + `/api/admin/classes/end-exam?term=${term}`;
    return httpClientService.uploadFile({ url: url }, file, terminal.append_response_json);
}

terminal.add_command('delete classes', delete_classes, { term: { type: 'string' } }, { timeout: 5000 });
function delete_classes(term) {
    let url = AppConfig.worker_config.service2.address + '/api/admin/classes?term=' + term;
    return httpClientService.ajax({ url: url, method: 'DELETE' }, terminal.append_response_json);
}
terminal.add_command('delete classes-mid-exam', delete_classes_mid_exam, { term: { type: 'string' } }, { timeout: 5000 });
function delete_classes_mid_exam(term) {
    let url = AppConfig.worker_config.service2.address + '/api/admin/classes/mid-exam?term=' + term;
    return httpClientService.ajax({ url: url, method: 'DELETE' }, terminal.append_response_json);
}
terminal.add_command('delete classes-end-exam', delete_classes_end_exam, { term: { type: 'string' } }, { timeout: 5000 });
function delete_classes_end_exam(term) {
    let url = AppConfig.worker_config.service2.address + '/api/admin/classes/end-exam?term=' + term;
    return httpClientService.ajax({ url: url, method: 'DELETE' }, terminal.append_response_json);
}
