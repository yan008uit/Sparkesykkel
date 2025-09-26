'use strict';

export class CoordinateAxes{
    constructor({ gl }, length = 100){
        this.gl = gl;
        this.length = length;

        const L = this.length;

        this.positions = new Float32Array([
            // X-axis
            - L, 0.0, 0.0,
              L, 0.0, 0.0,

            // Y-axis
            0.0, -L, 0.0,
            0.0,  L, 0.0,

            // Z-axis
            0.0, 0.0, -L,
            0.0, 0.0,  L,
        ]);

        this.colors = new Float32Array([
            // Red for x-axis
            1.0, 0.0, 0.0, 1,
            1.0, 0.0, 0.0, 1,

            // Green for y-axis
            0.0, 1.0, 0.0, 1,
            0.0, 1.0, 0.0, 1,

            // Blue for z-axis
            0.0, 0.0, 1.0, 1,
            0.0, 0.0, 1.0, 1,
        ]);

        this.vertexCount = this.positions.length / 3;

        // Position buffer
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        // Color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    draw(shaderInfo, modelMatrix) {
        const gl = this.gl;

        gl.useProgram(shaderInfo.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexPosition);

        if (shaderInfo.attribLocations.vertexColor !== -1 && shaderInfo.attribLocations.vertexColor !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.vertexAttribPointer(shaderInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexColor);
        }

        if (!modelMatrix) {
            modelMatrix = new Matrix4();
            modelMatrix.setIdentity();
        }
        if (shaderInfo.uniformLocations.modelMatrix)
            gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, modelMatrix.elements);

        gl.drawArrays(gl.LINES, 0, this.vertexCount);
    }
}