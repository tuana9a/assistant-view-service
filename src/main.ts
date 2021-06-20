import multer from 'multer';
import express from 'express';
import { webAppZipService } from './services/WebAppZipService';
import { requestFilter } from './security/RequestFilter';
import { webAppZipView } from './views/WebAppZipView';
import { lopDangKyView } from './views/LopDangKyView';
import { askMasterService } from './services/AskMasterService';
import { CONFIG } from './config/AppConfig';

class App {
    private RUNTIME: any = {};
    getRuntime(path: string) {
        let paths = path.split('.');
        try {
            return paths.reduce(function (pointer: any, cur: string) {
                return pointer[cur];
            }, this.RUNTIME);
        } catch (e) {
            return '';
        }
    }
    setRuntime(path: string, value: string) {
        let paths = path.split('.');
        let length = paths.length;
        let p = paths.reduce(function (pointer: any, cur: string, i: number) {
            if (i == length - 1) return pointer;
            let check = pointer[cur];
            if (!check) pointer[cur] = {};
            return pointer[cur];
        }, this.RUNTIME);
        p[paths[length - 1]] = value;
    }
    getWorkerAddress(name: string) {
        return this.getRuntime('workers.address.' + name);
    }
    setWorkerAddress(name: string, address: string) {
        this.setRuntime('workers.address.' + name, address);
    }
}

export const app = new App();

//EXPLAIN: init frontend
webAppZipService.extractWebApp_zip(CONFIG.PATH.WEBAPP_ZIP);
const server = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
server.use(express.json());
server.use(express.static('./webapp'));
server.all('/api/admin/*', requestFilter.authFilter);
server.get('/api/public/register-preview/classes', lopDangKyView.findClassesByTermAndIds);
server.get('/api/public/register-preview/student', lopDangKyView.findStudentByTermAndMssv);
server.post('/api/admin/webapp', upload.single('file'), webAppZipView.uploadWebApp_zip);

let port = process.env.PORT || CONFIG.SERVER.PORT;
server.listen(port).on('error', console.error);
console.log(` * listen: ${CONFIG.SERVER.ADDRESS}`);

async function askMaster() {
    let url = `${CONFIG.SERVER.MASTER_ADDRESS}/api/worker/ask/worker-address`;
    let from = {
        name: CONFIG.SERVER.NAME,
        address: CONFIG.SERVER.ADDRESS
    };
    let asks = [CONFIG.SERVER.NAME, 'assistant-school-register-preview'];
    return askMasterService.askWorkerAddress(url, from, asks);
}
async function intervalAskMaster() {
    await askMaster();
    setTimeout(intervalAskMaster, 10_000);
}

intervalAskMaster();
