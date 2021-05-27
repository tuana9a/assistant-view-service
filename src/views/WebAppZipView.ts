import { Request, Response } from 'express';

import { app } from '../main';
import { ResponseEntity } from '../models/ResponseEntity';
import { webAppZipService } from '../services/WebAppZipService';

class WebAppZipView {
    uploadWebApp_zip(req: Request, resp: Response) {
        let result = new ResponseEntity();
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');

        let file = req.file;
        if (file && file.size != 0) {
            result.body = 'upload success';
            webAppZipService.storeWebApp_zip('./resource/' + file.originalname, file);
            webAppZipService.extractWebApp_zip(app.CONFIG.WEBAPP_ZIP_PATH);
        } else {
            result.body = 'file not found: Chuc ban may man lan sau';
        }

        resp.send(result);
    }
}

export const webAppZipView = new WebAppZipView();
