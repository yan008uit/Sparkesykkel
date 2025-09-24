'use strict';

export class Cylinder {
    constructor(app, slices, texture) {
        this.gl = app.gl;
        this.texture = texture;
        this.vertexCount = 0;

        this.initBuffers(slices);
    }

    initBuffers(slices) {
        const gl = this.gl;
        const positions = [],
            normals = [],
            textureCoordinates = [],
            indices = [];

        for (let i = 0; i <= slices; i++) {
            const theta = i * 2 * Math.PI /slices;
            const x = 0.1 * Math.cos(theta);
            const z = 0.1 * Math.sin(theta);

            positions.push(x, 0.5, z, x, -0.5, z);
            normals.push(x, 0, z, x, 0, z);
            textureCoordinates.push(i / slices, 0, i / slices, 1);
        }

        for (let i = 0; i < slices; i++) {
            const t1 = i * 2;
            const t2 = (i + 1) * 2;
            const b1 = i * 2 + 1;
            const b2 = (i + 1) * 2 + 1;

            indices.push(t1, b1, t2);
            indices.push(b1, b2, t2);
        }

        // Buffers
        this.positionBuffer = this.createBuffer(positions, gl.ARRAY_BUFFER, Float32Array);
        this.normalsBuffer = this.createBuffer(normals, gl.ARRAY_BUFFER, Float32Array);
        this.textureCoordinatesBuffer = this.createBuffer(textureCoordinates, gl.ARRAY_BUFFER, Float32Array);
        this.indexBuffer = this.createBuffer(indices, gl.ELEMENT_ARRAY_BUFFER, Uint16Array);

        this.vertexCount = indices.length;
    }

    createBuffer(data, target, type) {
        const gl = this.gl;
        const buffer = gl.createBuffer();

        gl.bindBuffer(target, buffer);
        gl.bufferData(target, new type(data), gl.STATIC_DRAW);

        return buffer;
    }

    draw(shaderInfo, modelMatrix) {
        const gl = this.gl;

        // Position
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexPosition);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexNormal);

        // Indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // Texture
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordinatesBuffer);
        gl.vertexAttribPointer(shaderInfo.attribLocations.textureCoordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.textureCoordinates);

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(shaderInfo.uniformLocations.sampler, 0);
            gl.uniform1i(shaderInfo.uniformLocations.useTexture, 1);
        } else {
            gl.uniform1i(shaderInfo.uniformLocations.useTexture, 0);
        }

        // Matrix
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, modelMatrix.elements);
        const n = new Matrix4(modelMatrix);
        n.invert();
        n.transpose();
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.normalMatrix, false, n.elements);

        gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0)
    }
}