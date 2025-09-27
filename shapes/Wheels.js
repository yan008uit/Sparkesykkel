'use strict';

export class Wheels {
    constructor(app, slices, tireTexture) {
        this.gl = app.gl;
        this.tireTexture = tireTexture;
        this.slices = slices;

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        const slices = this.slices;

        const tirePositions = [];
        const tireTexCoords = [];
        const tireNormals = [];
        const tireIndices = [];

        const radius = 0.2;
        const halfHeight = 0.1;

        for (let i = 0; i <= slices; i++) {
            const theta = (i / slices) * 2 * Math.PI;
            const x = radius * Math.cos(theta);
            const z = radius * Math.sin(theta);

            tirePositions.push(x, halfHeight, z, x, -halfHeight, z);

            const nx = x / radius;
            const nz = z / radius;
            tireNormals.push(nx, 0, nz, nx, 0, nz);

            tireTexCoords.push(i / slices, 0.73633, i / slices, 1);
        }

        for (let i = 0; i < slices; i++) {
            const t1 = i * 2;
            const t2 = (i + 1) * 2;
            const b1 = t1 + 1;
            const b2 = t2 + 1;
            tireIndices.push(t1, b1, t2, b1, b2, t2);
        }

        this.tire = this.createPart(tirePositions, tireTexCoords, tireNormals, tireIndices);

        this.rimTop = this.createRim(this.slices, halfHeight);
        this.rimBottom = this.createRim(this.slices, -halfHeight);
    }

    createPart(positions, texCoords, normals, indices) {
        const gl = this.gl;
        return {
            position: this.createBuffer(positions, gl.ARRAY_BUFFER, Float32Array),
            textureCoordinates: this.createBuffer(texCoords, gl.ARRAY_BUFFER, Float32Array),
            normals: this.createBuffer(normals, gl.ARRAY_BUFFER, Float32Array),
            indices: this.createBuffer(indices, gl.ELEMENT_ARRAY_BUFFER, Uint16Array),
            vertexCount: indices.length
        };
    }

    createBuffer(data, target, type) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, new type(data), gl.STATIC_DRAW);
        return buffer;
    }

    createRim(slices, rimY) {
        const positions = [];
        const texCoords = [];
        const normals = [];
        const indices = [];
        const rimRadius = 0.2;

        const rimCenterU = 0.265;
        const rimCenterV = 0.265;
        const rimScale   = 0.255;

        positions.push(0, rimY, 0);
        normals.push(0, 1, 0);
        texCoords.push(rimCenterU, rimCenterV);

        for (let slice = 0; slice <= slices; slice++) {
            const angle = (slice / slices) * 2 * Math.PI;
            const x = rimRadius * Math.cos(angle);
            const z = rimRadius * Math.sin(angle);

            positions.push(x, rimY, z);
            normals.push(0, 1, 0);
            texCoords.push(rimCenterU + (x / rimRadius) * rimScale,
                rimCenterV + (z / rimRadius) * rimScale);
        }

        for (let slice = 1; slice <= slices; slice++) {
            indices.push(0, slice, slice + 1);
        }

        return this.createPart(positions, texCoords, normals, indices);
    }

    bindAttributes(part, shaderInfo) {
        const gl = this.gl;

        // Position
        gl.bindBuffer(gl.ARRAY_BUFFER, part.position);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexPosition);

        // Texture
        gl.bindBuffer(gl.ARRAY_BUFFER, part.textureCoordinates);
        gl.vertexAttribPointer(shaderInfo.attribLocations.textureCoordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.textureCoordinates);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, part.normals);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexNormal);
    }

    draw(shaderInfo, modelMatrix, rotation = 0) {
        const gl = this.gl;
        const tireMatrix = new Matrix4(modelMatrix).rotate(rotation, 0, 1, 0);

        this.bindAttributes(this.tire, shaderInfo);
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, tireMatrix.elements);

        const normalMatrix = new Matrix4(tireMatrix).invert().transpose();
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.normalMatrix, false, normalMatrix.elements);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tireTexture);
        gl.uniform1i(shaderInfo.uniformLocations.sampler, 0);
        gl.uniform1f(shaderInfo.uniformLocations.useTexture, 1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tire.indices);
        gl.drawElements(gl.TRIANGLES, this.tire.vertexCount, gl.UNSIGNED_SHORT, 0);

        [this.rimTop, this.rimBottom].forEach(rim => {
            this.bindAttributes(rim, shaderInfo);

            gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, tireMatrix.elements);

            const rimNormalMatrix = new Matrix4(tireMatrix).invert().transpose();
            gl.uniformMatrix4fv(shaderInfo.uniformLocations.normalMatrix, false, rimNormalMatrix.elements);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tireTexture);
            gl.uniform1i(shaderInfo.uniformLocations.sampler, 0);
            gl.uniform1f(shaderInfo.uniformLocations.useTexture, 1);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rim.indices);
            gl.drawElements(gl.TRIANGLES, rim.vertexCount, gl.UNSIGNED_SHORT, 0);
        });
    }
}