'use strict';

import { isPowerOfTwo1 } from './lib/utility-functions.js';
import { WebGLCanvas } from './helpers/WebGLCanvas.js';
import { WebGLShader } from './helpers/WebGLShader.js';
import { ImageLoader } from "./helpers/ImageLoader.js";
import { Camera } from "./helpers/Camera.js";
import { Stack } from "./helpers/Stack.js";
import { Cube } from "./shapes/Cube.js";
import { Wheels } from "./shapes/Wheels.js";
import { Cylinder } from "./shapes/Cylinder.js";
import { XZPlane } from "./shapes/XZPlane.js";
import { CoordinateAxes } from "./shapes/CoordinateAxes.js";

export function main() {
    const webGLCanvas = new WebGLCanvas('myCanvas', document.body, 960, 640);
    const gl = webGLCanvas.gl;

    const imageLoader = new ImageLoader();
    const textureUrls = ['textures/metal1.png', 'textures/wheelTexture.png'];

    imageLoader.load((images) => {
        const textures = {};
        textures.metal = createTexture(gl, images[0]);
        textures.wheel = createTexture(gl, images[1]);

        const renderInfo = {
            gl: gl,
            shaderInfo: initShaders(gl),
            textures: textures,
            currentlyPressedKeys: [],
            stack: new Stack(),
            lastTime: 0,
            fpsInfo: { frameCount: 0, lastTimeStamp: performance.now(), fps: 0 },
            animationInfo: { wheelRotation: 0, steeringAngle: 0 },
            frontWheel: new Wheels({ gl }, 32, textures.wheel),
            backWheel: new Wheels({ gl }, 32, textures.wheel),
            vCylinder: new Cylinder({ gl }, 32, textures.metal),
            hCylinder: new Cylinder({ gl }, 32, textures.metal),
            coord: new CoordinateAxes({ gl } ),
        };

        renderInfo.grid = new XZPlane({ gl }, 40, 40, 40);

        initKeyPress(renderInfo.currentlyPressedKeys);

        // Setting up camera and its initial position and viewpoint
        const camera = new Camera(gl, renderInfo.currentlyPressedKeys);
        camera.setPosition(0, 4, 10);
        camera.setLookAt(0, 0, 0);
        camera.set();

        animate(0, renderInfo, camera);
    }, textureUrls);
}

function createTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);

    if(isPowerOfTwo1(image.width) && isPowerOfTwo1(image.height)) gl.generateMipmap(gl.TEXTURE_2D);
    else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    return texture;
}

function initKeyPress(currentlyPressedKeys) {
    document.addEventListener('keyup', e => currentlyPressedKeys[e.code] = false);
    document.addEventListener('keydown', e => currentlyPressedKeys[e.code] = true);
}

function initShaders(gl) {
    // Gets shader info from index.html
    const vertexShaderSource = document.getElementById("base-vertex-shader").text;
    const fragmentShaderSource = document.getElementById("base-fragment-shader").text;

    // Initialize shader program
    const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

    return {
        program: glslShader.shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, "aVertexPosition"),
            vertexNormal: gl.getAttribLocation(glslShader.shaderProgram, "aVertexNormal"),
            textureCoordinates: gl.getAttribLocation(glslShader.shaderProgram, "aTextureCoord"),
            vertexColor: gl.getAttribLocation(glslShader.shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            modelMatrix: gl.getUniformLocation(glslShader.shaderProgram, "uModelMatrix"),
            viewMatrix: gl.getUniformLocation(glslShader.shaderProgram, "uViewMatrix"),
            projectionMatrix: gl.getUniformLocation(glslShader.shaderProgram, "uProjectionMatrix"),
            normalMatrix: gl.getUniformLocation(glslShader.shaderProgram, "uNormalMatrix"),
            ambientLight: gl.getUniformLocation(glslShader.shaderProgram, "uAmbientLight"),
            directionalLight: gl.getUniformLocation(glslShader.shaderProgram, "uDirectionalLight"),
            directionalDir: gl.getUniformLocation(glslShader.shaderProgram, "uDirectionalDir"),
            pointLightPos: gl.getUniformLocation(glslShader.shaderProgram, "uPointLightPos"),
            pointLightColor: gl.getUniformLocation(glslShader.shaderProgram, "uPointLightColor"),
            sampler: gl.getUniformLocation(glslShader.shaderProgram, "uSampler"),
            useTexture: gl.getUniformLocation(glslShader.shaderProgram, "uUseTexture"),
            fragmentColor: gl.getUniformLocation(glslShader.shaderProgram, "uFragmentColor"),
        }
    };
}

function animate(currentTime, renderInfo, camera) {
    window.requestAnimationFrame((time)=>animate(time,renderInfo,camera));
    let elapsed = 0;
    if(renderInfo.lastTime!==0) elapsed=(currentTime-renderInfo.lastTime)/1000;
    renderInfo.lastTime=currentTime;

    renderInfo.fpsInfo.frameCount++;
    if(currentTime - renderInfo.fpsInfo.lastTimeStamp >= 1000){
        renderInfo.fpsInfo.fps = renderInfo.fpsInfo.frameCount;
        renderInfo.fpsInfo.frameCount = 0;
        renderInfo.fpsInfo.lastTimeStamp = currentTime;

        const fpsDiv = document.getElementById('fpsCounter');
        if(fpsDiv) fpsDiv.textContent = `FPS: ${renderInfo.fpsInfo.fps}`;
    }

    // Update camera
    camera.handleKeys(elapsed);
    camera.set();

    handleKeys(renderInfo);
    draw(currentTime, renderInfo, camera);
}

function handleKeys(renderInfo){
    if(renderInfo.currentlyPressedKeys['KeyF']) renderInfo.animationInfo.wheelRotation+=5;
    if(renderInfo.currentlyPressedKeys['KeyG']) renderInfo.animationInfo.wheelRotation-=5;
    if(renderInfo.currentlyPressedKeys['ArrowLeft']) renderInfo.animationInfo.steeringAngle=Math.max(renderInfo.animationInfo.steeringAngle-22.5,-45);
    if(renderInfo.currentlyPressedKeys['ArrowRight']) renderInfo.animationInfo.steeringAngle=Math.min(renderInfo.animationInfo.steeringAngle+22.5,45);
}

function clearCanvas(gl){
    gl.clearColor(0.9,0.9,0.9,1);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
}

function draw(currentTime,renderInfo,app){
    clearCanvas(renderInfo.gl);
    drawScooter(renderInfo,app);
}

function drawScooter(renderInfo, camera){
    const gl = renderInfo.gl,
        shader= renderInfo.shaderInfo,
        stack = renderInfo.stack,
        anim= renderInfo.animationInfo;

    gl.useProgram(shader.program);

    // Camera
    const viewMatrix = camera.getViewMatrix();
    const projectionMatrix = camera.getProjectionMatrix();
    gl.uniformMatrix4fv(shader.uniformLocations.projectionMatrix, false, projectionMatrix.elements);
    gl.uniformMatrix4fv(shader.uniformLocations.viewMatrix, false, viewMatrix.elements);

    // Lights
    gl.uniform3fv(shader.uniformLocations.ambientLight, [0.1, 0.1, 0.1]);
    gl.uniform3fv(shader.uniformLocations.directionalLight, [0.7, 0.7, 0.7]);
    gl.uniform3fv(shader.uniformLocations.directionalDir, [-1.0, -1.0, -1.0]);
    gl.uniform3fv(shader.uniformLocations.pointLightPos, [2.0, 2.0, 2.0]);
    gl.uniform3fv(shader.uniformLocations.pointLightColor, [1.0, 0.9, 0.8]);

    // Coordinate system
    const coordModel = new Matrix4();
    coordModel.setIdentity();
    gl.uniform1i(shader.uniformLocations.useTexture, 0);
    renderInfo.coord.draw(renderInfo.shaderInfo, coordModel);

    gl.disableVertexAttribArray(shader.attribLocations.vertexColor);

    const normalMatrix = new Matrix4();

    // XZ-plane
    let gridModel = new Matrix4();
    gridModel.translate(0, -0.25, 0);
    normalMatrix.setInverseOf(gridModel);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.grid.draw(renderInfo.shaderInfo, gridModel);

    stack.pushMatrix(new Matrix4());

    // Platform
    let modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0, 0, 0);
    modelMatrix.scale(1.3, 0.1, 0.3);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    const deck = new Cube(renderInfo, renderInfo.textures.metal);
    deck.draw(renderInfo.shaderInfo, modelMatrix);

    // Front wheel support
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(1.3, 0.3, 0);
    modelMatrix.rotate(-45, 0, 0, 1);
    modelMatrix.scale(0.65, 0.75, 0.65);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.vCylinder.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix()

    // Front (rotating part)
    stack.pushMatrix(stack.peekMatrix());
    let frontMatrix = stack.peekMatrix();
    frontMatrix.translate(1.6, 0.3, 0);
    frontMatrix.rotate(anim.steeringAngle, 0, 1, 0);

    // Vertical cylinder for steering
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-0.2, 1.0, 0);
    modelMatrix.rotate(15,0,0,1);
    modelMatrix.scale(0.65, 1.6, 0.65);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.vCylinder.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix();

    // Horizontal cylinder (steering bar)
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-0.4, 1.8, 0);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.7, 1.3, 0.5);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.hCylinder.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix();

    // Left handle
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-0.4, 1.8, 0.77);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.7, 0.25, 0.7);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.hCylinder.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix();

    // Right handle
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-0.4, 1.8, -0.77);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.7, 0.25, 0.7);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.hCylinder.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix();

    // Front wheel axis cylinder
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(1.6, 0.3, 0);
    modelMatrix.scale(0.55, 0.55, 0.5);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.vCylinder.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix();

    // Front wheel
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0,-0.35,0);
    modelMatrix.rotate(90,1,0,0);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.frontWheel.draw(renderInfo.shaderInfo, modelMatrix, anim.wheelRotation);
    stack.popMatrix();

    stack.popMatrix();

    // Rear wheel support arm (v)
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-1.2, 0.15, 0);
    modelMatrix.rotate(-35,0,0,1);
    modelMatrix.scale(0.08, 0.02, 0.04);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    const supportArm = new Cube(renderInfo, renderInfo.textures.metal);
    supportArm.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix();

    // Rear wheel support arm (h)
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-1.5, 0.20, 0);
    modelMatrix.rotate(90,1,0,0);
    modelMatrix.scale(0.35, 0.1, 0.01);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    const supportArm2 = new Cube(renderInfo, renderInfo.textures.metal);
    supportArm2.draw(renderInfo.shaderInfo, modelMatrix);

    stack.popMatrix()

    // Rear wheel
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix=stack.peekMatrix();
    modelMatrix.translate(-1.6,-0.05,0);
    modelMatrix.rotate(90, 1, 0, 0);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix.elements);
    renderInfo.backWheel.draw(renderInfo.shaderInfo, modelMatrix, anim.wheelRotation);
    stack.popMatrix();

    stack.popMatrix();
}