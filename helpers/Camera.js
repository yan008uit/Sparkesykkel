'use strict';
import { rotateVector } from "/lib/utility-functions.js";

export class Camera {
    constructor(
        gl,
        currentlyPressedKeys = [],
        camPosX = 5, camPosY = 20, camPosZ = 35,
        lookAtX = 0, lookAtY = 0, lookAtZ = 0,
        upX = 0, upY = 1, upZ = 0,
    ) {
        this.gl = gl;
        this.currentlyPressedKeys = currentlyPressedKeys;

        this.camPosX = camPosX;
        this.camPosY = camPosY;
        this.camPosZ = camPosZ;

        this.lookAtX = lookAtX;
        this.lookAtY = lookAtY;
        this.lookAtZ = lookAtZ;

        this.upX = upX;
        this.upY = upY;
        this.upZ = upZ;

        this.near = 0.1;
        this.far  = 10000;

        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
    }

    set() {
        this.viewMatrix.setLookAt(
            this.camPosX, this.camPosY, this.camPosZ,
            this.lookAtX, this.lookAtY, this.lookAtZ,
            this.upX, this.upY, this.upZ
        );

        const fov = 45;
        const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.projectionMatrix.setPerspective(fov, aspect, this.near, this.far);
    }

    getModelViewMatrix(modelMatrix) {
        const mv = new Matrix4(this.viewMatrix); // copy
        mv.multiply(modelMatrix); // mv = V * M
        return mv;
    }

    setPosition(x, y, z) {
        this.camPosX = x;
        this.camPosY = y;
        this.camPosZ = z;
    }

    setLookAt(x, y, z) {
        this.lookAtX = x;
        this.lookAtY = y;
        this.lookAtZ = z;
    }

    setUp(x, y, z) {
        this.upX = x;
        this.upY = y;
        this.upZ = z;
    }

    setNear(n) { this.near = n; }
    setFar(f)  { this.far  = f; }

    handleKeys(elapsed) {
        const camPosVec = vec3.fromValues(this.camPosX, this.camPosY, this.camPosZ);

        if (this.currentlyPressedKeys['KeyA']) rotateVector( 2, camPosVec, 0, 1, 0);
        if (this.currentlyPressedKeys['KeyW']) rotateVector( 2, camPosVec, 1, 0, 0);
        if (this.currentlyPressedKeys['KeyD']) rotateVector(-2, camPosVec, 0, 1, 0);
        if (this.currentlyPressedKeys['KeyS']) rotateVector(-2, camPosVec, 1, 0, 0);
        if (this.currentlyPressedKeys['KeyV']) vec3.scale(camPosVec, camPosVec, 1.05);
        if (this.currentlyPressedKeys['KeyB']) vec3.scale(camPosVec, camPosVec, 0.95);

        this.camPosX = camPosVec[0];
        this.camPosY = camPosVec[1];
        this.camPosZ = camPosVec[2];
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    toString() {
        return `x:${this.camPosX.toFixed(1)}, y:${this.camPosY.toFixed(1)}, z:${this.camPosZ.toFixed(1)}`;
    }
}