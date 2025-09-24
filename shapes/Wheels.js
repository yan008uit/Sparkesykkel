'use strict';

export class Wheels {
    constructor(app, slices, tireTexture) {
        this.gl = app.gl;
        this.tireTexture = tireTexture;

        this.initBuffers(slices);

    }
    initBuffers(slices) {
        const gl = this.gl;

        // Tire
        const tirePositions = [],
            tireTexCoords = [],
            tireNormals = [],
            tireIndices = [];

        for (let i = 0; i <= slices; i++) {
            const radius = 0.2;
            const theta = i * 2 * Math.PI /slices;
            const x = radius * Math.cos(theta);
            const z = radius * Math.sin(theta);

            tirePositions.push(x, 0.1, z, x, -0.1, z);
            tireTexCoords.push(i / slices, 0, i / slices, 1);
            tireNormals.push(x, 0, z, x, 0, z);
        }

        for (let i = 0; i < slices; i++) {
            const t1 = i * 2;
            const t2 = (i +1) * 2;
            const b1 = i * 2 + 1;
            const b2 = (i + 1) * 2 + 1;

            tireIndices.push(t1, b1, t2);
            tireIndices.push(b1, b2, t2);
        }

        this.tire = {
            position: this.createBuffer(tirePositions, gl.ARRAY_BUFFER, Float32Array),
            textureCoordinates: this.createBuffer(tireTexCoords, gl.ARRAY_BUFFER, Float32Array),
            normals:   this.createBuffer(tireNormals, gl.ARRAY_BUFFER, Float32Array),
            indices:  this.createBuffer(tireIndices, gl.ELEMENT_ARRAY_BUFFER, Uint16Array),
            vertexCount: tireIndices.length
        };

        // Tire rim
        const rimPositions = [],
            rimTexCoords = [],
            rimNormals = [],
            rimIndices = [];

        const innerRadius = 0.2;
        const tube = 0.05;

        for (let slice = 0; slice <= slices; slice++) {
            const sliceAngle = (slice / slices) * 2 * Math.PI;

            for (let ring = 0; ring <= slices; ring++) {
                const ringAngle = (ring / slices) * 2 * Math.PI;
                const x = (innerRadius + tube * Math.cos(ringAngle)) * Math.cos(sliceAngle);
                const y= tube * Math.sin(ringAngle);
                const z= (innerRadius + tube *Math.cos(ringAngle)) * Math.sin(sliceAngle);

                rimPositions.push(x, y, z);
                rimNormals.push(x, y, z);
                rimTexCoords.push(slice / slices, ring / slices * 0.5)
            }
        }

        for (let slice = 0; slice < slices; slice++) {
            for (let ring = 0; ring < slices; ring++) {
                const first = slice * (slices + 1) + ring;
                const second = first + slices + 1;

                rimIndices.push(first, second, first + 1);
                rimIndices.push(second, second + 1, first + 1);
            }
        }

        this.rim = {
            position: this.createBuffer(rimPositions, gl.ARRAY_BUFFER, Float32Array),
            textureCoordinates: this.createBuffer(rimTexCoords, gl.ARRAY_BUFFER, Float32Array),
            normals:   this.createBuffer(rimNormals, gl.ARRAY_BUFFER, Float32Array),
            indices:  this.createBuffer(rimIndices, gl.ELEMENT_ARRAY_BUFFER, Uint16Array),
            vertexCount: rimIndices.length
        };
    }

    createBuffer(data, target, type) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, new type(data), gl.STATIC_DRAW);

        return buffer;
    }

    draw(shaderInfo, modelMatrix, rotation) {
        const gl = this.gl;
        const tireMatrix = new Matrix4(modelMatrix);

        this.bindAttributes(this.tire, shaderInfo);
        tireMatrix.rotate(rotation, 0, 0, 1);

        gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, tireMatrix.elements);
        const n1 = new Matrix4(tireMatrix);
        n1.invert();
        n1.transpose();
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.normalMatrix, false, n1.elements);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tireTexture);
        gl.uniform1i(shaderInfo.uniformLocations.sampler, 0);
        gl.uniform1i(shaderInfo.uniformLocations.useTexture, 1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tire.indices);
        gl.drawElements(gl.TRIANGLES, this.tire.vertexCount, gl.UNSIGNED_SHORT, 0);

        // Rim
        this.bindAttributes(this.rim, shaderInfo);
        gl.uniform1i(shaderInfo.uniformLocations.useTexture, 0);
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.modelMatrix, false, modelMatrix.elements);
        const n2 = new Matrix4(modelMatrix); n2.invert(); n2.transpose();
        gl.uniformMatrix4fv(shaderInfo.uniformLocations.normalMatrix, false, n2.elements);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.rim.indices);
        gl.drawElements(gl.TRIANGLES, this.rim.vertexCount, gl.UNSIGNED_SHORT, 0);
    }

    bindAttributes(part, shaderInfo) {
        const gl = this.gl;

        // Position
        gl.bindBuffer(gl.ARRAY_BUFFER, part.position);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexPosition);

        // Texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, part.textureCoordinates);
        gl.vertexAttribPointer(shaderInfo.attribLocations.textureCoordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.textureCoordinates);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, part.normals);
        gl.vertexAttribPointer(shaderInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexNormal);
    }
}