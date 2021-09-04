"use strict";

class AnimationService {
    makeElement_DragToMove(element) {
        let deltaX = 0;
        let deltaY = 0;
        let positionX = 0;
        let positionY = 0;

        let drag_header;

        if ((drag_header = element.querySelector(".drag-to-move-header"))) {
            // if present, the header is where you move the DIV from:
            drag_header.addEventListener("mousedown", mousedown);
            drag_header.addEventListener("touchstart", touchdown, { passive: false });
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            element.addEventListener("mousedown", mousedown);
            element.addEventListener("touchstart", touchdown, { passive: false });
        }

        // SECTION: mouse drag
        function mousedown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            positionX = e.clientX;
            positionY = e.clientY;

            document.addEventListener("mouseup", mouseup);
            document.addEventListener("mousemove", mousemove);
        }
        function mousemove(e) {
            e = e || window.event;
            e.preventDefault();
            // caculate delta from previos
            deltaX = e.clientX - positionX;
            deltaY = e.clientY - positionY;
            // calculate the new cursor position
            positionX = e.clientX;
            positionY = e.clientY;
            // set the element's new position
            element.style.top = element.offsetTop + deltaY + "px";
            element.style.left = element.offsetLeft + deltaX + "px";
            // EXPLAIN: dùng cho element muốn phân biệt drag vs click
            element.setAttribute("data-animation-dragging", true);
        }
        function mouseup(e) {
            // stop moving when mouse button is released:
            document.removeEventListener("mouseup", mouseup);
            document.removeEventListener("mousemove", mousemove);
            // EXPLAIN: set time out để event click sẽ phân biệt đc vs drag, click sẽ k trigger nếu đang drag
            setTimeout(() => element.setAttribute("data-animation-dragging", false), 0);
        }

        // SECTION: touch drag
        function touchdown(e) {
            e = e || window.event;
            // e.preventDefault();//EXPLAIN: nếu prevent thì click bị chặn
            // get the mouse cursor position at startup:
            positionX = e.touches[0].clientX;
            positionY = e.touches[0].clientY;

            document.addEventListener("touchend", touchup);
            document.addEventListener("touchmove", touchmove, { passive: false });
        }
        function touchmove(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate delta from previous position
            deltaX = e.touches[0].clientX - positionX;
            deltaY = e.touches[0].clientY - positionY;
            // calculate the new cursor position
            positionX = e.touches[0].clientX;
            positionY = e.touches[0].clientY;
            // set the element's new position
            element.style.top = element.offsetTop + deltaY + "px";
            element.style.left = element.offsetLeft + deltaX + "px";
            // EXPLAIN: dùng cho element muốn phân biệt drag vs click
            element.setAttribute("data-animation-dragging", true);
        }
        function touchup(e) {
            // stop moving when mouse button is released:
            document.removeEventListener("touchend", touchup);
            document.removeEventListener("touchmove", touchmove);
            // EXPLAIN: set time out để event click sẽ phân biệt đc vs drag
            setTimeout(() => element.setAttribute("data-animation-dragging", false), 0);
        }
    }
    makeElement_GoogleIcon(element) {
        let width = element.style.width;
        let height = element.style.height;
        element.innerHTML = `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
            viewBox="0 0 48 48">
            <g>
                <path fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z">
                </path>
                <path fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z">
                </path>
                <path fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z">
                </path>
                <path fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z">
                </path>
                <path fill="none" d="M0 0h48v48H0z"></path>
            </g>
        </svg>
        `;
    }
    makeElement_RoundAndRoundIcon(element) {
        let width = element.style.width;
        let height = element.style.height;
        element.innerHTML = `
            <svg width="${width}" height="${height}" class="spin-animation" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(0,50) scale(0.1,-0.1)" fill="#000000"
                    stroke="none">
                    <path d="M173 451 c-30 -14 -43 -26 -43 -40 0 -30 14 -33 63 -11 51 23 92 19
                        144 -12 52 -31 97 -148 57 -148 -13 0 -12 -7 9 -42 14 -23 29 -43 33 -45 5 -1
                        21 18 36 42 24 40 25 45 9 45 -14 0 -20 10 -24 40 -7 55 -51 126 -96 156 -54
                        35 -132 41 -188 15z"></path>
                    <path d="M28 315 c-24 -40 -25 -45 -9 -45 14 0 20 -10 24 -40 18 -137 161
                        -225 280 -172 33 15 47 27 47 41 0 30 -14 33 -63 11 -51 -23 -92 -19 -144 12
                        -52 31 -97 148 -57 148 13 0 12 7 -9 42 -14 23 -29 43 -33 45 -5 1 -21 -18
                        -36 -42z"></path>
                </g>
            </svg>
            `;
    }
    makeElement_BellIcon_normal(element) {
        let width = element.style.width;
        let height = element.style.height;
        element.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" enable-background="new 0 0 512 512" viewBox="0 0 512 512">
            <path d="m450.201 407.453c-1.505-.977-12.832-8.912-24.174-32.917-20.829-44.082-25.201-106.18-25.201-150.511 0-.193-.004-.384-.011-.576-.227-58.589-35.31-109.095-85.514-131.756v-34.657c0-31.45-25.544-57.036-56.942-57.036h-4.719c-31.398 0-56.942 25.586-56.942 57.036v34.655c-50.372 22.734-85.525 73.498-85.525 132.334 0 44.331-4.372 106.428-25.201 150.511-11.341 24.004-22.668 31.939-24.174 32.917-6.342 2.935-9.469 9.715-8.01 16.586 1.473 6.939 7.959 11.723 15.042 11.723h109.947c.614 42.141 35.008 76.238 77.223 76.238s76.609-34.097 77.223-76.238h109.947c7.082 0 13.569-4.784 15.042-11.723 1.457-6.871-1.669-13.652-8.011-16.586zm-223.502-350.417c0-14.881 12.086-26.987 26.942-26.987h4.719c14.856 0 26.942 12.106 26.942 26.987v24.917c-9.468-1.957-19.269-2.987-29.306-2.987-10.034 0-19.832 1.029-29.296 2.984v-24.914zm29.301 424.915c-25.673 0-46.614-20.617-47.223-46.188h94.445c-.608 25.57-21.549 46.188-47.222 46.188zm60.4-76.239c-.003 0-213.385 0-213.385 0 2.595-4.044 5.236-8.623 7.861-13.798 20.104-39.643 30.298-96.129 30.298-167.889 0-63.417 51.509-115.01 114.821-115.01s114.821 51.593 114.821 115.06c0 .185.003.369.01.553.057 71.472 10.25 127.755 30.298 167.286 2.625 5.176 5.267 9.754 7.861 13.798z" />
        </svg>
        `;
    }
    makeElement_BellIcon_ring(element) {
        let width = element.style.width;
        let height = element.style.height;
        element.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" class="shake-animation" enable-background="new 0 0 512 512" viewBox="0 0 512 512">
            <g>
                <path d="m411 262.862v-47.862c0-69.822-46.411-129.001-110-148.33v-21.67c0-24.813-20.187-45-45-45s-45 20.187-45 45v21.67c-63.59 19.329-110 78.507-110 148.33v47.862c0 61.332-23.378 119.488-65.827 163.756-4.16 4.338-5.329 10.739-2.971 16.267s7.788 9.115 13.798 9.115h136.509c6.968 34.192 37.272 60 73.491 60 36.22 0 66.522-25.808 73.491-60h136.509c6.01 0 11.439-3.587 13.797-9.115s1.189-11.929-2.97-16.267c-42.449-44.268-65.827-102.425-65.827-163.756zm-170-217.862c0-8.271 6.729-15 15-15s15 6.729 15 15v15.728c-4.937-.476-9.94-.728-15-.728s-10.063.252-15 .728zm15 437c-19.555 0-36.228-12.541-42.42-30h84.84c-6.192 17.459-22.865 30-42.42 30zm-177.67-60c34.161-45.792 52.67-101.208 52.67-159.138v-47.862c0-68.925 56.075-125 125-125s125 56.075 125 125v47.862c0 57.93 18.509 113.346 52.671 159.138z" />
                <path d="m451 215c0 8.284 6.716 15 15 15s15-6.716 15-15c0-60.1-23.404-116.603-65.901-159.1-5.857-5.857-15.355-5.858-21.213 0s-5.858 15.355 0 21.213c36.831 36.831 57.114 85.8 57.114 137.887z" />
                <path d="m46 230c8.284 0 15-6.716 15-15 0-52.086 20.284-101.055 57.114-137.886 5.858-5.858 5.858-15.355 0-21.213-5.857-5.858-15.355-5.858-21.213 0-42.497 42.497-65.901 98.999-65.901 159.099 0 8.284 6.716 15 15 15z" />
            </g>
        </svg>
        `;
    }
}
export const animationService = new AnimationService();

document.querySelectorAll(".drag-to-move").forEach(animationService.makeElement_DragToMove);
document.querySelectorAll("span.google-icon").forEach(animationService.makeElement_GoogleIcon);
document.querySelectorAll("span.round-and-round-icon").forEach(animationService.makeElement_RoundAndRoundIcon);
document.querySelectorAll("span.bell-icon-normal").forEach(animationService.makeElement_BellIcon_normal);
document.querySelectorAll("span.bell-icon-ring").forEach(animationService.makeElement_BellIcon_ring);
