
const fs = require("fs");
const axios = require("axios").default;
const multer = require("multer");
const adm_zip = require("adm-zip");
const express = require("express");

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const log_helper = require("./common/log-helper");
const date_helper = require("./common/date-helper");


const ROOT_FOLDER = __dirname;
const CONFIG = {
    server: {
        port: -1,
    },
    registerPreview: {
        address: ""
    },
    schoolService: {
        address: ""
    },
    WEBAPP_DRIVE: "",
    ROOT_KEY: "",
    CURRENT_KEY: "",
}


//SECTION: I/O
async function loadConfig() {
    console.log(String(fs.readFileSync("favicon.txt")));
    return Promise.all([
        new Promise((resolve, reject) => {
            let whichConfig = process.argv[2] == "--local" ? "config-local.json" : "config.json";
            console.log("load config: " + whichConfig);
            fs.readFile(whichConfig, "utf-8", (error, data) => {
                let config = JSON.parse(data);
                CONFIG.server = config.server;
                CONFIG.registerPreview = config.registerPreview;
                CONFIG.schoolService = config.schoolService;
                CONFIG.ROOT_KEY = config.ROOT_KEY;
                CONFIG.WEBAPP_DRIVE = config.WEBAPP_DRIVE;
                resolve();
            });
        }),

    ]);
}
async function initServer() {
    const app = express();
    app.use(express.json());

    app.get('/', async function (req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp/index.html');
    });


    app.get('/api/public/register-preview/classes', async function (req, resp) {
        let ids = req.query.ids;
        let term = req.query.term;
        let url = `${CONFIG.registerPreview.address}/api/public/classes?ids=${ids}&term=${term}`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/register-preview/guess-class', async function (req, resp) {
        let id = req.query.id;
        let term = req.query.term;
        let url = `${CONFIG.registerPreview.address}/api/public/guess-class?id=${id}&term=${term}`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/school-service/terms', async function (req, resp) {
        let url = `${CONFIG.schoolService.address}/api/public/terms`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/school-service/current-term', async function (req, resp) {
        let url = `${CONFIG.schoolService.address}/api/public/current-term`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });


    app.get('/register-preview', async function (req,resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp/register-preview.html', (err) => {
            if (err) {
                resp.status(404).sendFile(ROOT_FOLDER + '/webapp/404.html', (err) => {
                    if (err) log_helper.error(err);
                });
            }
        });
    });
    app.get('/automate-register', async function(req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp/automate-register.html', (err) => {
            if (err) {
                resp.status(404).sendFile(ROOT_FOLDER + '/webapp/404.html', (err) => {
                    if (err) log_helper.error(err);
                });
            }
        });
    });


    app.post('/api/admin/webapp', upload.single('file'), async function (req, resp) {
        resp.setHeader("Content-Type", "application/json; charset=utf-8");
        let result = { success: true, body: {} };

        let auth = req.headers["auth"];
        if (auth == CONFIG.CURRENT_KEY) {
            let file = req.file;
            if (file && file.size != 0) {
                result.body = "update success";
                let zipPath = "./webapp/" + file.originalname;
                fs.writeFileSync(zipPath, file.buffer, { flag: "w" });
                new adm_zip(zipPath).extractAllTo("./webapp/", true);
            } else {
                result.body = "no file";
            }
        } else {
            result.success = false;
            result.body = "unauthorized";
        }

        resp.write(JSON.stringify(result));
        resp.end();
    });
    app.put('/api/micro/current-key', async function (req, resp) {
        resp.setHeader("Content-Type", "application/json; charset=utf-8");
        let body = req.body;
        let auth = req.headers["auth"];
        let result = { success: true, body: {} };

        let key = body.key;
        if (auth == CONFIG.ROOT_KEY) {
            CONFIG.CURRENT_KEY = key;
            result.body = "update success";
        } else {
            result.success = false;
        }
        resp.write(JSON.stringify(result));
        resp.end();
    });

    
    app.get('/*', async function (req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp' + req.path, (err) => {
            if (err) {
                resp.status(404).sendFile(ROOT_FOLDER + '/webapp/404.html', (err) => {
                    if (err) log_helper.error(err);
                });
            }
        });
    });


    return new Promise((resolve, reject) => {
        const server = app.listen(process.env.PORT || CONFIG.server.port, function () {
            let port = server.address().port;
            console.log("server start at http://%s:%s", "127.0.0.1", port);
            resolve();
        });
        server.on("error", reject);
    });
}
async function download(url = "", outputPath = "") {
    const outputStream = fs.createWriteStream(outputPath);

    return axios({ method: 'GET', url: url, responseType: 'stream', }).then(response => {
        //ensure that the user can call `then()` only when the file has been downloaded entirely.
        return new Promise((resolve, reject) => {
            response.data.pipe(outputStream);
            let error = null;
            outputStream.on('error', err => {
                error = err;
                outputStream.close();
                reject(err);
            });
            outputStream.on('close', () => {
                if (!error) {
                    resolve(true);
                }
                //no need to call the reject here, as it will have been called in the
                //'error' stream;
            });
        });
    });
}
async function pullWebApp_zip() {
    let zipPath = "./webapp/webapp.zip";
    const FILE_URL = "https://drive.google.com/uc?export=download&id=" + CONFIG.WEBAPP_DRIVE;
    await download(FILE_URL, zipPath).catch(log_helper.error);
    new adm_zip(zipPath).extractAllTo("./webapp/", true);
}


async function main() {
    loadConfig().then(() => {
        initServer().then(() => {
            pullWebApp_zip();
        }).catch(log_helper.error);
    }).catch(log_helper.error);
}

main()
