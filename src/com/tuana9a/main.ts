import cors from 'cors';
import multer from 'multer';
import express from 'express';
import { requestFilter } from './security/RequestFilter';
import { webAppZipView } from './views/WebAppZipView';
import { AppConfig } from './config/AppConfig';

//EXPLAIN: init frontend
const server = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

server.use(cors());
server.use(express.json());
server.use(express.static('./webapp'));

server.all('/api/admin/*', requestFilter.authFilter);
server.post('/api/admin/webapp', upload.single('file'), webAppZipView.uploadWebApp_zip);

let port = process.env.PORT || AppConfig.server.port;
server.listen(port).on('error', console.error);
console.log(` * listen: ${AppConfig.server.address}`);
