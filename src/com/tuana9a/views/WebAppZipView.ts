import { Request, Response } from 'express';
import { AppConfig } from '../config/AppConfig';

import { ResponseEntity } from '../models/ResponseEntity';
import { webAppZipService } from '../services/WebAppZipService';
import { responseUtils } from '../utils/ResponseUtils';

class WebAppZipView {
    uploadWebApp_zip(req: Request, resp: Response) {
        try {
            let file = req.file;
            if (file && file.size != 0) {
                webAppZipService.storeWebApp_zip('./resource/' + file.originalname, file);
                webAppZipService.extractWebApp_zip(AppConfig.path.webapp_zip);
                responseUtils.send(resp, ResponseEntity.builder().code(1).message('success upload').build());
            } else {
                responseUtils.send(resp, ResponseEntity.builder().code(-1).message('file not found').build());
            }
        } catch (e) {
            responseUtils.send(resp, ResponseEntity.builder().code(-1).message('failed').data(e).build());
        }
    }
}

export const webAppZipView = new WebAppZipView();
