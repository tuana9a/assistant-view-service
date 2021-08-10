import fs from 'fs';

var config = {
    server: {
        address: '',
        port: -1
    },
    path: {
        resource_dir: ''
    }
};
config = JSON.parse(fs.readFileSync('resource/app-config.json', { flag: 'r', encoding: 'utf-8' }));

export const AppConfig = config;
