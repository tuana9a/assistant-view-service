"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const express_1 = __importDefault(require("express"));
const RegisterPreviewView_1 = require("./views/RegisterPreviewView");
const ResponseEntity_1 = require("./models/ResponseEntity");
const CONFIG = {};
var registerPreviewView;
const app = express_1.default();
async function loadConfig(CONFIG, configfolder, name) {
    return new Promise((resolve) => {
        let path = `${configfolder}/${name}-local.json`;
        fs_1.default.readFile(path, 'utf-8', (err, data) => {
            if (err) {
                path = `${configfolder}/${name}.json`;
                fs_1.default.readFile(path, 'utf-8', (_err, data) => {
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
async function loadAllConfig(CONFIG, configfolder) {
    return Promise.all([
        loadConfig(CONFIG, configfolder, 'server'),
        loadConfig(CONFIG, configfolder, 'microservice'),
        loadConfig(CONFIG, configfolder, 'security')
    ]);
}
async function currentKeyFilter(req, resp, next) {
    let auth = req.headers['auth'];
    if (auth == CONFIG.security.CURRENT_KEY) {
        next();
    }
    else {
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');
        resp.status(403).send({ succes: false, body: 'Chuc ban may man lan sau' }).end();
    }
}
function uploadWebApp_zip(req, resp) {
    let result = new ResponseEntity_1.ResponseEntity();
    resp.setHeader('Content-Type', 'application/json; charset=utf-8');
    let file = req.file;
    if (file && file.size != 0) {
        result.body = 'upload success';
        let zipPath = './webapp/webapp.zip';
        fs_1.default.writeFileSync(zipPath, file.buffer, { flag: 'w' });
        unpackWebApp_zip();
    }
    else {
        result.body = 'file not found: Chuc ban may man lan sau';
    }
    resp.send(result);
}
function unpackWebApp_zip() {
    let path = './webapp/webapp.zip';
    try {
        new adm_zip_1.default(path).extractAllTo('./webapp/', true);
    }
    catch (e) {
        console.error(e);
    }
}
class App {
    constructor() {
        console.log(' * VIEW SERVICE WEBSERVICE');
    }
    getMicroAddress(name) {
        return CONFIG.microservice[name].address;
    }
    async init() {
        unpackWebApp_zip();
        await loadAllConfig(CONFIG, './config');
        registerPreviewView = new RegisterPreviewView_1.RegisterPreviewView(this);
        app.use(express_1.default.json());
        app.use(express_1.default.static('./webapp'));
        const upload = multer_1.default({ limits: { fileSize: 10 * 1024 * 1024 } });
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
exports.App = App;
//# sourceMappingURL=app.js.map