export class WebGLCanvas {
    constructor(id, parent, width, height) {
        let divWrapper = document.createElement("div");
        this.canvas = document.createElement("canvas");

        parent.appendChild(divWrapper);
        divWrapper.appendChild(this.canvas);
        divWrapper.id = id

        this.canvas.width = width;
        this.canvas.height = height;

        this.gl = this.canvas.getContext("webgl2", {stencil: true});

        if (!this.gl)
            throw new Error("WebGL is not supported!");
    }
}
