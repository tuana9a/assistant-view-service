import fs from 'fs';
import multer from 'multer';
import express from 'express';
import { webAppZipService } from './services/WebAppZipService';
import { requestFilter } from './security/RequestFilter';
import { webAppZipView } from './views/WebAppZipView';
import { lopDangKyView } from './views/LopDangKyView';
import { askMasterService } from './services/AskMasterService';

class App {
    CONFIG: any = {};
    loadConfig(name: string, path: string) {
        try {
            let data = fs.readFileSync(path, { flag: 'r', encoding: 'utf-8' });
            this.CONFIG[`${name}`] = JSON.parse(data);
            console.log(` * config: ${path}: SUCCESS`);
        } catch (e) {
            console.log(` * config: ${path}: FAILED`);
        }
    }
    getConfig(path: string) {
        let paths = path.split('.');
        return paths.reduce(function (pointer: any, cur: string) {
            let check = pointer[cur];
            if (!check) pointer[cur] = {};
            return pointer[cur];
        }, this.CONFIG);
    }
    setConfig(path: string, value: string) {
        let paths = path.split('.');
        let length = paths.length;
        let p = paths.reduce(function (pointer: any, cur: string, i: number) {
            if (i == length - 1) return pointer;
            let check = pointer[cur];
            if (!check) pointer[cur] = {};
            return pointer[cur];
        }, this.CONFIG);
        p[paths[length - 1]] = value;
    }
    autoConfig(configFolder: string) {
        let filenames = fs.readdirSync(configFolder);
        for (let filename of filenames) {
            if (filename.match(/.json$/)) {
                let name = filename.slice(0, -5);
                this.loadConfig(name, configFolder + '/' + filename);
            }
        }
    }
    getWorkerAddress(name: string) {
        return this.getConfig('workers.address.' + name);
    }
    setWorkerAddress(name: string, address: string) {
        this.setConfig('workers.address.' + name, address);
    }
    async askMaster() {
        let url = `${app.getConfig('server.master-address')}/api/worker/ask/worker-address`;
        let from = {
            name: 'assistant-view-service',
            address: app.getConfig('server.address')
        };
        let asks = ['assistant-view-service', 'assistant-school-register-preview'];
        return askMasterService.askWorkerAddress(url, from, asks);
    }
}

export const app = new App();
app.autoConfig('./config');

const server = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
server.use(express.json());
server.use(express.static('./webapp'));
server.all('/api/admin/*', requestFilter.authFilter);
server.get('/api/public/register-preview/classes', lopDangKyView.findClassesByTermAndIds);
server.get('/api/public/register-preview/student', lopDangKyView.findStudentByTermAndMssv);
server.post('/api/admin/webapp', upload.single('file'), webAppZipView.uploadWebApp_zip);

let port = process.env.PORT || app.getConfig('server.port');
server.listen(port).on('error', console.error);
console.log(` * listen: ${app.getConfig('server.address')}`);

//EXPLAIN: init frontend
webAppZipService.extractWebApp_zip(app.getConfig('server.path.zips.webapp'));

async function intervalAskMaster() {
    await app.askMaster();
    setTimeout(intervalAskMaster, 10_000);
}
intervalAskMaster();
