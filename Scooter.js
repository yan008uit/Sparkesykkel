'use strict';

import {WebGLCanvas} from './helpers/WebGLCanvas.js';
import {WebGLShader} from './helpers/WebGLShader.js';
import {Camera} from "./helpers/Camera.js";
import {Stack} from "./helpers/Stack.js";
import {ImageLoader} from "./helpers/ImageLoader.js";
import {isPowerOfTwo1} from './lib/utility-functions.js';

export function main() {
    const glWrapper = new WebGLCanvas('myCanvas', document.body, 960, 640);
    const gl = glWrapper.gl;

    const imageLoader = new ImageLoader();
    const textureUrls = ['textures/metal1.png', 'textures/wheelTexture.png'];

    imageLoader.load((images) => {
        const textures = {};
        textures.metal = createTexture(gl, images[0]);
        textures.wheel = createTexture(gl, images[1]);

        const renderInfo = {
            gl: gl,
            shaderInfo: initShaders(gl),
            cubeBuffer: initCubeBuffers(gl),
            cylinderBuffer: initCylinderBuffers(gl, 32),
            wheelBuffer: initWheelBuffers(gl, 32),
            textures: textures,
            currentlyPressedKeys: [],
            stack: new Stack(),
            lastTime: 0,
            fpsInfo: { frameCount: 0, lastTimeStamp: 0 },
            animationInfo: { wheelRotation: 0, steeringAngle: 0 }
        };

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
    const vertexShaderSource = document.getElementById("base-vertex-shader").text;
    const fragmentShaderSource = document.getElementById("base-fragment-shader").text;

    const glslShader = new WebGLShader(gl, vertexShaderSource, fragmentShaderSource);

    return {
        program: glslShader.shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(glslShader.shaderProgram, "aVertexPosition"),
            vertexNormal: gl.getAttribLocation(glslShader.shaderProgram, "aVertexNormal"),
            textureCoord: gl.getAttribLocation(glslShader.shaderProgram, "aTextureCoord"),
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

// --- Cube Buffers ---
function initCubeBuffers(gl) {
    const positions = [
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
        -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
        -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
        -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1
    ];
    const normals = [
        0,0,1,0,0,1,0,0,1,0,0,1,
        0,0,-1,0,0,-1,0,0,-1,0,0,-1,
        0,1,0,0,1,0,0,1,0,0,1,0,
        0,-1,0,0,-1,0,0,-1,0,0,-1,0,
        1,0,0,1,0,0,1,0,0,1,0,0,
        -1,0,0,-1,0,0,-1,0,0,-1,0,0
    ];
    const texcoords = [
        0,0,1,0,1,1,0,1,
        0,0,1,0,1,1,0,1,
        0,0,1,0,1,1,0,1,
        0,0,1,0,1,1,0,1,
        0,0,1,0,1,1,0,1,
        0,0,1,0,1,1,0,1
    ];
    const indices = [];
    for(let i=0;i<6;i++) indices.push(i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(texcoords),gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);

    return { position: posBuffer, normal: normalBuffer, texcoord: texBuffer, indices: indexBuffer, vertexCount: indices.length };
}

function initCylinderBuffers(gl,slices){
    const positions=[], normals=[], texcoords=[], indices=[];
    for(let i=0;i<=slices;i++){
        const theta=i*2*Math.PI/slices;
        const x=0.1*Math.cos(theta), z=0.1*Math.sin(theta);
        positions.push(x,0.5,z,x,-0.5,z);
        normals.push(x,0,z,x,0,z);
        texcoords.push(i/slices,0,i/slices,1);
    }
    for(let i=0;i<slices;i++){
        const t1=i*2,b1=i*2+1,t2=(i+1)*2,b2=(i+1)*2+1;
        indices.push(t1,b1,t2); indices.push(b1,b2,t2);
    }
    const posBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
    const normalBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
    const texBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(texcoords),gl.STATIC_DRAW);
    const indexBuffer=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);

    return {position:posBuffer,normal:normalBuffer,texcoord:texBuffer,indices:indexBuffer,vertexCount:indices.length};
}

// --- Wheel Buffers (Tire + Rim) ---
function initWheelBuffers(gl,slices){
    const tirePositions=[], tireTex=[], tireIndices=[], tireNormals=[];
    for(let i=0;i<=slices;i++){
        const theta=i*2*Math.PI/slices;
        const x=0.5*Math.cos(theta), z=0.5*Math.sin(theta);
        tirePositions.push(x,0.1,z,x,-0.1,z);
        tireTex.push(i/slices,0,i/slices,1);
        tireNormals.push(x,0,z,x,0,z);
    }
    for(let i=0;i<slices;i++){
        const t1=i*2,b1=i*2+1,t2=(i+1)*2,b2=(i+1)*2+1;
        tireIndices.push(t1,b1,t2); tireIndices.push(b1,b2,t2);
    }
    const tirePosBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,tirePosBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tirePositions),gl.STATIC_DRAW);
    const tireTexBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,tireTexBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tireTex),gl.STATIC_DRAW);
    const tireIndexBuffer=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,tireIndexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(tireIndices),gl.STATIC_DRAW);

    // Rim simplified torus
    const rimPositions=[], rimTex=[], rimIndices=[], rimNormals=[];
    const innerR=0.2, outerR=0.3, tube=0.05;
    for(let slice=0;slice<=slices;slice++){
        const slice_angle=(slice/slices)*2*Math.PI;
        for(let ring=0;ring<=slices;ring++){
            const ring_angle=(ring/slices)*2*Math.PI;
            const x=(innerR+tube*Math.cos(ring_angle))*Math.cos(slice_angle);
            const y=tube*Math.sin(ring_angle);
            const z=(innerR+tube*Math.cos(ring_angle))*Math.sin(slice_angle);
            rimPositions.push(x,y,z);
            rimNormals.push(x,y,z);
            rimTex.push(slice/slices,ring/slices*0.5);
        }
    }
    for(let slice=0;slice<slices;slice++){
        for(let ring=0;ring<slices;ring++){
            const first=slice*(slices+1)+ring, second=first+slices+1;
            rimIndices.push(first,second,first+1); rimIndices.push(second,second+1,first+1);
        }
    }
    const rimPosBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,rimPosBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(rimPositions),gl.STATIC_DRAW);
    const rimTexBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,rimTexBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(rimTex),gl.STATIC_DRAW);
    const rimIndexBuffer=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,rimIndexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(rimIndices),gl.STATIC_DRAW);

    return {
        tire:{position:tirePosBuffer,texcoord:tireTexBuffer,indices:tireIndexBuffer,vertexCount:tireIndices.length},
        rim:{position:rimPosBuffer,texcoord:rimTexBuffer,indices:rimIndexBuffer,vertexCount:rimIndices.length}
    };
}

// --- Animation Loop ---
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

function drawCube(gl, shader, renderInfo, texture) {
    gl.bindBuffer(gl.ARRAY_BUFFER, renderInfo.cubeBuffer.position);
    gl.vertexAttribPointer(shader.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderInfo.cubeBuffer.texcoord);
    gl.vertexAttribPointer(shader.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribLocations.textureCoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderInfo.cubeBuffer.indices);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shader.uniformLocations.useTexture, 1);

    gl.drawElements(gl.TRIANGLES, renderInfo.cubeBuffer.vertexCount, gl.UNSIGNED_SHORT, 0);
}

function drawCylinder(gl, shader, renderInfo, texture) {
    gl.bindBuffer(gl.ARRAY_BUFFER, renderInfo.cylinderBuffer.position);
    gl.vertexAttribPointer(shader.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderInfo.cylinderBuffer.texcoord);
    gl.vertexAttribPointer(shader.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribLocations.textureCoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderInfo.cylinderBuffer.indices);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shader.uniformLocations.useTexture, 1);

    gl.drawElements(gl.TRIANGLES, renderInfo.cylinderBuffer.vertexCount, gl.UNSIGNED_SHORT, 0);
}

function drawScooter(renderInfo,camera){
    const gl=renderInfo.gl, shader=renderInfo.shaderInfo, stack=renderInfo.stack, anim=renderInfo.animationInfo;
    gl.useProgram(shader.program);

    // Camera matrices
    const viewMatrix = camera.getViewMatrix();
    const projectionMatrix = camera.getProjectionMatrix();
    gl.uniformMatrix4fv(shader.uniformLocations.projectionMatrix, false, projectionMatrix.elements);
    gl.uniformMatrix4fv(shader.uniformLocations.viewMatrix, false, viewMatrix.elements);

    gl.uniform3fv(shader.uniformLocations.ambientLight,[0.3,0.3,0.3]);
    gl.uniform3fv(shader.uniformLocations.directionalLight,[0.6,0.6,0.6]);
    gl.uniform3fv(shader.uniformLocations.directionalDir,[0.0,-1.0,-1.0]);
    gl.uniform3fv(shader.uniformLocations.pointLightPos,[5,10,5]);
    gl.uniform3fv(shader.uniformLocations.pointLightColor,[1,1,1]);

    stack.pushMatrix(new Matrix4());

    // --- Plattform (deck) ---
    let modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0, 0, 0);
    modelMatrix.scale(1.3, 0.1, 0.3);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    drawCube(gl, shader, renderInfo, renderInfo.textures.metal);

    // --- Frontparti (styre + forhjul) ---
    stack.pushMatrix(stack.peekMatrix());
    let frontMatrix = stack.peekMatrix();
    frontMatrix.translate(1.0, -0.05, 0);
    frontMatrix.rotate(anim.steeringAngle, 0, 1, 0);

    // Styrestang (vertikal)
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0.35, 1.0, 0);
    modelMatrix.scale(0.5, 2.2, 0.5);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    drawCylinder(gl, shader, renderInfo, renderInfo.textures.metal);
    stack.popMatrix();

    // Horisontal styrestang
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0.35, 2.1, 0);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.5, 1.5, 0.5);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    drawCylinder(gl, shader, renderInfo, renderInfo.textures.metal);
    stack.popMatrix();

    // Venstre håndtak
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(-0.45, 1.2, 0);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.2, 0.1, 0.1);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    drawCylinder(gl, shader, renderInfo, renderInfo.textures.metal);
    stack.popMatrix();

    // Høyre håndtak
    stack.pushMatrix(frontMatrix);
    modelMatrix = stack.peekMatrix();
    modelMatrix.translate(0.45, 1.2, 0);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(0.2, 0.1, 0.1);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, modelMatrix.elements);
    drawCylinder(gl, shader, renderInfo, renderInfo.textures.metal);
    stack.popMatrix();

    // --- Wheels ---
    // Front
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix=stack.peekMatrix();
    modelMatrix.translate(0.9,-0.15,0);
    modelMatrix.rotate(anim.steeringAngle,0,1,0);
    drawWheel(renderInfo,modelMatrix);
    stack.popMatrix();

    // Back
    stack.pushMatrix(stack.peekMatrix());
    modelMatrix=stack.peekMatrix();
    modelMatrix.translate(-0.9,-0.15,0);
    drawWheel(renderInfo,modelMatrix);
    stack.popMatrix();

    stack.popMatrix();
}

function drawWheel(renderInfo,modelMatrix){
    const gl=renderInfo.gl, shader=renderInfo.shaderInfo, anim=renderInfo.animationInfo;

    // Tire
    gl.bindBuffer(gl.ARRAY_BUFFER,renderInfo.wheelBuffer.tire.position);
    gl.vertexAttribPointer(shader.attribLocations.vertexPosition,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER,renderInfo.wheelBuffer.tire.texcoord);
    gl.vertexAttribPointer(shader.attribLocations.textureCoord,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(shader.attribLocations.textureCoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,renderInfo.wheelBuffer.tire.indices);
    gl.bindTexture(gl.TEXTURE_2D,renderInfo.textures.wheel);
    gl.uniform1i(shader.uniformLocations.useTexture,1);

    const tireMatrix=new Matrix4(modelMatrix);
    tireMatrix.rotate(anim.wheelRotation,0,0,1);
    gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix,false,tireMatrix.elements);
    gl.drawElements(gl.TRIANGLES,renderInfo.wheelBuffer.tire.vertexCount,gl.UNSIGNED_SHORT,0);

    // Rim
    gl.bindBuffer(gl.ARRAY_BUFFER,renderInfo.wheelBuffer.rim.position);
    gl.vertexAttribPointer(shader.attribLocations.vertexPosition,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER,renderInfo.wheelBuffer.rim.texcoord);
    gl.vertexAttribPointer(shader.attribLocations.textureCoord,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(shader.attribLocations.textureCoord);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,renderInfo.wheelBuffer.rim.indices);
    gl.drawElements(gl.TRIANGLES,renderInfo.wheelBuffer.rim.vertexCount,gl.UNSIGNED_SHORT,0);
}