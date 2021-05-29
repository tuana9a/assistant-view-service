import { Request, Response } from 'express';

import { app } from '../main';
import { ResponseEntity } from '../models/ResponseEntity';
import { webAppZipService } from '../services/WebAppZipService';

class WebAppZipView {
    uploadWebApp_zip(req: Request, resp: Response) {
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');

        let file = req.file;
        if (file && file.size != 0) {
            webAppZipService.storeWebApp_zip('./resource/' + file.originalname, file);
            webAppZipService.extractWebApp_zip(app.getConfig('webapp-zip-path'));
            resp.send(ResponseEntity.builder().code(1).message('success upload').build());
        } else {
            resp.send(ResponseEntity.builder().code(-1).message('file not found: Chuc ban may man lan sau').build());
        }
    }
}

export const webAppZipView = new WebAppZipView();
