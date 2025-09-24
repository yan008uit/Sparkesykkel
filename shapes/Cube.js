'use strict';

export class Cube {
    constructor(app, texture){
        this.gl = app.gl;
        this.texture = texture;
        this.vertexCount = 0;

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const positions = [
            -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
            -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
            -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
            -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
             1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
            -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1
        ];

        const normals = [
             0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
             0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,
             0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
             0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,
             1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
            -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0
        ];

        const textureCoords = [
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1
        ];

        const indices = [];
        for (let i = 0; i < 6; i++) {
            indices.push(
                i * 4,
                i * 4 + 1,
                i * 4 + 2,
                i * 4,
                i * 4 + 2,
                i * 4 + 3
            );
        }

        // Position buffer
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Normal buffer
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // Texture buffer
        this.textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

        // Index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.vertexCount = indices.length;

    }

    draw(shaderInfo, modelMatrix) {
        const gl = this.gl;

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexPosition);

        // Normal attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexNormal);

        // Texture attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.textureCoordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.textureCoordinates);

        // Indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // Texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(shaderInfo.uniformLocations.sampler, 0);
        gl.uniform1i(shaderInfo.uniformLocations.useTexture, 1);

        // Matrices
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, modelMatrix.elements);

        if (shaderInfo.uniformLocations.normalMatrix) {
            const n = new Matrix4(modelMatrix);
            n.invert();
            n.transpose();
            gl.uniformMatrix4fv(shaderInfo.uniformLocations.normalMatrix, false, n.elements);
        }

        gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
    }
}
