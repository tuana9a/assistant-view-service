
const fs = require("fs");
const axios = require("axios").default;
const multer = require("multer");
const adm_zip = require("adm-zip");
const express = require("express");

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const common = require("./common/common");
const log_helper = require("./common/log-helper");
const date_helper = require("./common/date-helper");


const ROOT_FOLDER = __dirname;
const CONFIG = {
    SERVER: {
        isLocal: false,
        port: -1,
    },
    SECURITY: {
        isLocal: false,
        ROOT_KEY: "",
        CURRENT_KEY: "",
    },
    DATABASE: {
        isLocal: false,
        address: "",
        username: "",
        password: "",
        authSource: "",
    },
    MICROSERVICE: {
        isLocal: false,
        viewService: {
            address: ""
        },
        masterService: {
            address: ""
        },
        schoolService: {
            address: ""
        },
        registerPreview: {
            address: ""
        },
        securityService: {
            address: ""
        }
    },
    GOOGLE_DRIVE: {
        isLocal: false,
        WEBAPP_ZIP: "",
    }
}


//SECTION: config
async function loadConfig(name, which) {
    return new Promise((resolve, reject) => {
        fs.readFile(`./config/${name}-local.json`, "utf-8", (err, data) => {
            if (err) {
                fs.readFile(`./config/${name}.json`, "utf-8", (err, data) => {
                    console.log(`load ${name}.json`);
                    CONFIG[`${which}`] = JSON.parse(data);
                    resolve();
                });
                return;
            }
            console.log(`load ${name}-local.json`);
            CONFIG[`${which}`] = JSON.parse(data);
            resolve();
        });
    });
}
async function loadAllConfig() {
    console.log(String(fs.readFileSync("favicon.txt")));

    return Promise.all([
        loadConfig("server", "SERVER"),
        loadConfig("microservice", "MICROSERVICE"),
        loadConfig("security", "SECURITY"),
        loadConfig("google-drive", "GOOGLE_DRIVE"),
    ]);
}


//SECTION: I/O
async function initServer() {
    const app = express();
    app.use(express.json());

    app.get('/', async function (req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp/index.html');
    });


    app.get('/api/public/register-preview/classes', async function (req, resp) {
        let ids = req.query.ids;
        let term = req.query.term;

        let url = `${CONFIG.MICROSERVICE.registerPreview.address}/api/public/classes?ids=${ids}&term=${term}`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/register-preview/guess-classes', async function (req, resp) {
        let ids = req.query.ids;
        let term = req.query.term;

        let url = `${CONFIG.MICROSERVICE.registerPreview.address}/api/public/guess-classes?ids=${ids}&term=${term}`;
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

        let url = `${CONFIG.MICROSERVICE.schoolService.address}/api/public/terms`;
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

        let url = `${CONFIG.MICROSERVICE.schoolService.address}/api/public/current-term`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/school-service/student-register/:term/:mssv', async function (req, resp) {
        let term = req.params.term;
        let mssv = req.params.mssv;

        let url = `${CONFIG.MICROSERVICE.schoolService.address}/api/public/student-register/${term}/${mssv}`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });


    app.get('/register-preview', async function (req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp/register-preview.html', (err) => {
            if (err) {
                resp.status(404).sendFile(ROOT_FOLDER + '/webapp/404.html', (err) => {
                    if (err) log_helper.error(err);
                });
            }
        });
    });
    app.get('/automate-register', async function (req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp/automate-register.html', (err) => {
            if (err) {
                resp.status(404).sendFile(ROOT_FOLDER + '/webapp/404.html', (err) => {
                    if (err) log_helper.error(err);
                });
            }
        });
    });


    app.post('/api/admin/webapp', upload.single('file'), async function (req, resp) {
        let auth = req.headers["auth"];

        let result = { success: true, body: {} };
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        if (auth == CONFIG.SECURITY.CURRENT_KEY) {
            let file = req.file;
            if (file && file.size != 0) {
                result.body = "update success";
                let zipPath = "./webapp/webapp.zip";
                fs.writeFileSync(zipPath, file.buffer, { flag: "w" });
                loadWebApp_zip();
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
        let body = req.body;
        let auth = req.headers["auth"];

        let result = { success: true, body: {} };
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        let key = body.key;
        if (auth == CONFIG.SECURITY.ROOT_KEY) {
            CONFIG.SECURITY.CURRENT_KEY = key;
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
        const server = app.listen(process.env.PORT || CONFIG.SERVER.port, function () {
            let port = server.address().port;
            console.log("server start at http://%s:%s", "127.0.0.1", port);
            resolve();
        });
        server.on("error", reject);
    });
}
async function loadWebApp_zip() {
    let zipPath = "./webapp/webapp.zip";
    try {
        new adm_zip(zipPath).extractAllTo("./webapp/", true);
    } catch (e) {
        log_helper.error(e);
    }
}
async function pullWebApp_zip() {
    let zipPath = "./webapp/webapp.zip";
    const FILE_URL = "https://drive.google.com/uc?export=download&id=" + CONFIG.GOOGLE_DRIVE.WEBAPP_ZIP;
    return common.axios_download(FILE_URL, zipPath)
        .then(loadWebApp_zip)
        .catch(log_helper.error);
}


async function main() {
    loadAllConfig().then(() => {
        initServer().then(() => {
            pullWebApp_zip();
        }).catch(log_helper.error);
    }).catch(log_helper.error);
}

main()
