import fs from 'fs';
import adm_zip from 'adm-zip';

class WebAppZipService {
    storeWebApp_zip(path: string, file: Express.Multer.File) {
        fs.writeFileSync(path, file.buffer, { flag: 'w' });
    }
    extractWebApp_zip(path: string) {
        try {
            new adm_zip(path).extractAllTo('./webapp/', true);
            console.log(` * extract: ${path}: SUCCESS`);
        } catch (e) {
            console.log(` * extract: ${path}: FAILED: ` + e);
        }
    }
}

export const webAppZipService = new WebAppZipService();
