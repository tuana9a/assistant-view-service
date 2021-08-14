import cors from 'cors';
import express from 'express';
import { requestFilter } from './security/RequestFilter';
import { AppConfig } from './config/AppConfig';

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.static('./webapp'));

server.all('/api/admin/*', requestFilter.adminFilter);
server.all('/worker-config.json', function (req, resp) {
    resp.sendFile(AppConfig.path.resource_dir + 'worker-config.json', { root: '.' });
});

let port = process.env.PORT || AppConfig.server.port;
server.listen(port).on('error', console.error);
console.log(` * listen: ${AppConfig.server.address}`);
