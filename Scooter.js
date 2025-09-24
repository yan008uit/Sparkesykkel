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
            fpsInfo: { frameCount: 0, lastTimeStamp: 0 },
            animationInfo: { wheelRotation: 0, steeringAngle: 0 },
            frontWheel: new Wheels({ gl }, 32, textures.wheel),
            backWheel: new Wheels({ gl }, 32, textures.wheel),
            vCylinder: new Cylinder({ gl }, 32, textures.metal),
            hCylinder: new Cylinder({ gl }, 32, textures.metal),
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

// Animation Loop
function animate(currentTime, renderInfo, camera) {
    window.requestAnimationFrame((time)=>animate(time,renderInfo,camera));
    let elapsed = 0;
    if(renderInfo.lastTime!==0) elapsed=(currentTime-renderInfo.lastTime)/1000;
    renderInfo.lastTime=currentTime;

    // Update camera
    camera.handleKeys(elapsed);
    camera.set();

    handleKeys(renderInfo);
    draw(currentTime, renderInfo, camera);
}

function handleKeys(renderInfo){
    if(renderInfo.currentlyPressedKeys['KeyF']) renderInfo.animationInfo.wheelRotation+=5;
    if(renderInfo.currentlyPressedKeys['KeyG']) renderInfo.animationInfo.wheelRotation-=5;
    if(renderInfo.currentlyPressedKeys['ArrowLeft']) renderInfo.animationInfo.steeringAngle=Math.max(renderInfo.animationInfo.steeringAngle-2,-45);
    if(renderInfo.currentlyPressedKeys['ArrowRight']) renderInfo.animationInfo.steeringAngle=Math.min(renderInfo.animationInfo.steeringAngle+2,45);
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

function drawScooter(renderInfo,camera){
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
    gl.uniform3fv(shader.uniformLocations.ambientLight,[0.3, 0.3, 0.3]);
    gl.uniform3fv(shader.uniformLocations.directionalLight,[0.6, 0.6, 0.6]);
    gl.uniform3fv(shader.uniformLocations.directionalDir,[0.0, -1.0, -1.0]);
    gl.uniform3fv(shader.uniformLocations.pointLightPos,[5, 10, 5]);
    gl.uniform3fv(shader.uniformLocations.pointLightColor,[1, 1, 1]);

    // XZ-plane
    let gridModel = new Matrix4();
    gridModel.translate(0, -0.25, 0);
    renderInfo.grid.draw(renderInfo.shaderInfo, gridModel);

    stack.pushMatrix(new Matrix4());

    // Platform
    let modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0, 0, 0);
    modelMatrix.scale(1.3, 0.1, 0.3);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);

    const deck = new Cube(renderInfo, renderInfo.textures.metal);
    deck.draw(renderInfo.shaderInfo, modelMatrix);

    // Front
    stack.pushMatrix(stack.peekMatrix());
    let frontMatrix = stack.peekMatrix();
    frontMatrix.translate(1.0, -0.05, 0);
    frontMatrix.rotate(anim.steeringAngle, 0, 1, 0);

    // Vertical cylinder for steering wheel
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0.35, 1.0, 0);
    modelMatrix.scale(0.5, 2.2, 0.5);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    renderInfo.vCylinder.draw(renderInfo.shaderInfo, modelMatrix);
    stack.popMatrix();

    // Horizontal cylinder for steering wheel
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0.35, 2.1, 0);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.5, 1.5, 0.5);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    renderInfo.hCylinder.draw(renderInfo.shaderInfo, modelMatrix);
    stack.popMatrix();

    // Left handle
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-0.45, 1.2, 0);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.2, 0.1, 0.1);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    renderInfo.hCylinder.draw(renderInfo.shaderInfo, modelMatrix);
    stack.popMatrix();

    // Right handle
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0.45, 1.2, 0);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.2, 0.1, 0.1);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    renderInfo.hCylinder.draw(renderInfo.shaderInfo, modelMatrix);
    stack.popMatrix();

    // Front wheel
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix=stack.peekMatrix();
    modelMatrix.translate(0.9,-0.15,0);
    modelMatrix.rotate(anim.steeringAngle,0,1,0);
    modelMatrix.rotate(90, 90, 0, 1);
    renderInfo.frontWheel.draw(renderInfo.shaderInfo, modelMatrix, anim.wheelRotation);
    stack.popMatrix();

    // Back wheel
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix=stack.peekMatrix();
    modelMatrix.translate(-0.9,-0.15,0);
    modelMatrix.rotate(90, 90, 0, 1);
    renderInfo.backWheel.draw(renderInfo.shaderInfo, modelMatrix, anim.wheelRotation);
    stack.popMatrix();

    stack.popMatrix();
}
