import fs from 'fs';

var config = {
    server: {
        address: '',
        port: -1
    },
    path: {
        webapp_zip: ''
    }
};
config = JSON.parse(fs.readFileSync('resource/app-config.json', { flag: 'r', encoding: 'utf-8' }));

export const AppConfig = config;
