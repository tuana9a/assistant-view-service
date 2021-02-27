import fs from 'fs';
import multer from 'multer';
import adm_zip from 'adm-zip';
import express, { Request, Response, NextFunction } from 'express';

import { RegisterPreviewView } from './views/RegisterPreviewView';
import { ResponseEntity } from './models/ResponseEntity';

const CONFIG: any = {};
var registerPreviewView: RegisterPreviewView;

const app = express();

async function loadConfig(CONFIG: any, configfolder: string, name: string) {
    return new Promise((resolve) => {
        let path = `${configfolder}/${name}-local.json`;
        fs.readFile(path, 'utf-8', (err, data) => {
            if (err) {
                path = `${configfolder}/${name}.json`;
                fs.readFile(path, 'utf-8', (_err, data) => {
                    console.log(` * ${name}.json`);
                    CONFIG[`${name}`] = JSON.parse(data);
                    resolve(undefined);
                });
                return;
            }
            console.log(` * ${name}-local.json`);
            CONFIG[`${name}`] = JSON.parse(data);
            resolve(undefined);
        });
    });
}
async function loadAllConfig(CONFIG: any, configfolder: string) {
    return Promise.all([
        loadConfig(CONFIG, configfolder, 'server'),
        loadConfig(CONFIG, configfolder, 'microservice'),
        loadConfig(CONFIG, configfolder, 'security')
    ]);
}

async function currentKeyFilter(req: Request, resp: Response, next: NextFunction) {
    let auth = req.headers['auth'];
    if (auth == CONFIG.security.CURRENT_KEY) {
        next();
    } else {
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');
        resp.status(403).send({ succes: false, body: 'Chuc ban may man lan sau' }).end();
    }
}

function uploadWebApp_zip(req: Request, resp: Response) {
    let result = new ResponseEntity();
    resp.setHeader('Content-Type', 'application/json; charset=utf-8');

    let file = req.file;
    if (file && file.size != 0) {
        result.body = 'upload success';
        let zipPath = './webapp/webapp.zip';
        fs.writeFileSync(zipPath, file.buffer, { flag: 'w' });
        unpackWebApp_zip();
    } else {
        result.body = 'file not found: Chuc ban may man lan sau';
    }

    resp.send(result);
}
function unpackWebApp_zip() {
    let path = './webapp/webapp.zip';
    try {
        new adm_zip(path).extractAllTo('./webapp/', true);
    } catch (e) {
        console.error(e);
    }
}

export class App {
    constructor() {
        console.log(' * VIEW SERVICE WEBSERVICE');
    }
    getMicroAddress(name: string) {
        return CONFIG.microservice[name].address;
    }

    async init() {
        unpackWebApp_zip();
        await loadAllConfig(CONFIG, './config');

        registerPreviewView = new RegisterPreviewView(this);

        app.use(express.json());
        app.use(express.static('./webapp'));
        const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
        app.all('/api/admin/*', currentKeyFilter);

        app.get('/api/public/register-preview/classes', registerPreviewView.findClassesByTermAndIds);
        app.get('/api/public/register-preview/student', registerPreviewView.findStudentByTermAndMssv);

        app.post('/api/admin/webapp', upload.single('file'), uploadWebApp_zip);
    }
    async run() {
        let port = process.env.PORT || CONFIG.server.port;
        app.listen(port).on('error', console.error);
        console.log(` * http://localhost:${port}`);
    }
}
