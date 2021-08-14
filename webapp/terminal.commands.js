'use strict';

import { terminal } from './terminal.js';

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
