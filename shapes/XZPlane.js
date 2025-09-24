'use strict';

export class XZPlane {
    constructor(app, width = 40, depth = 40, cells = 40, color = [0.2, 0.2, 0.2, 1]) {
        this.gl = app.gl;
        this.width = width;
        this.depth = depth;
        this.cells = cells;
        this.color = color;
        this.vertexCount = 0;

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const positions = [];

        // Grid lines along X
        for (let i = 0; i <= this.cells; i++) {
            const z = -this.depth / 2 + (i * this.depth) / this.cells;
            positions.push(-this.width / 2, 0, z,  this.width / 2, 0, z);
        }

        // Grid lines along Z
        for (let j = 0; j <= this.cells; j++) {
            const x = -this.width / 2 + (j * this.width) / this.cells;
            positions.push(x, 0, -this.depth / 2,  x, 0, this.depth / 2);
        }

        this.vertexCount = positions.length / 3;

        // Buffers
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }

    draw(shaderInfo, modelMatrix) {
        const gl = this.gl;

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexPosition);

        gl.uniform1i(shaderInfo.uniformLocations.useTexture, 0);
        gl.uniform4f(
            shaderInfo.uniformLocations.fragmentColor,
            this.color[0], this.color[1], this.color[2], this.color[3]
        );

        gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, modelMatrix.elements);
        gl.drawArrays(gl.LINES, 0, this.vertexCount);
    }
}