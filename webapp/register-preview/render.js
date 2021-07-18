'use strict';

/**
 * quản lí việc render ra front end
 */
class RenderService {
    renderGuessIdsFromClasses(classes = []) {
        if (classes.length == 0) {
            let content = `<div><span style="color: var(--green_neon);">không tìm thấy</span></div>`;
            CONTAINER_GUESS_CLASS_IDS_TAG.innerHTML = content;
            return;
        }
        classes.forEach(function (classs) {
            let content = `${classs.maLop} - ${classs.tenHocPhan} - ${classs.loaiLop}`;
            lopDangKyElementManager.addGuessIdToContainer(content);
        });
    }
}
export const renderService = new RenderService();
