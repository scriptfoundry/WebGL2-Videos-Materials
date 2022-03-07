// tslint:disable: no-console

import { mat4 } from 'gl-matrix';

const PROJECTION_STORAGE_NAME = 'camera projection storage';
const mainVertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform mat4 uViewMatrix2;
uniform mat4 uProjectionMatrix2;

uniform bool uUseSecondaryViewProjection;
uniform sampler2D uSampler;

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

out vec4 vColor;

vec4 invertZ = vec4(1,1,-1,1);

void main()
{
    vColor = texture(uSampler, aTexCoord);
    if (!uUseSecondaryViewProjection)
    {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
    }
    else
    {
        gl_Position =
            uProjectionMatrix2 * uViewMatrix2 *             // 2nd set of view-projection matrices
            uProjectionMatrix * uViewMatrix * uModelMatrix  // main model-view-projection matrices
            * aPosition;

        // double-applying ViewProjection "double flips" the x axis too, so we'll unflip it once here:
        gl_Position.x = -gl_Position.x;
    }
}`;

const boxVertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform mat4 uViewMatrix2;
uniform mat4 uProjectionMatrix2;

layout(location=0) in vec4 aPosition;
layout(location=1) in vec4 aColor;

out vec4 vColor;

void main()
{
    vColor = aColor;
    gl_Position = uProjectionMatrix2 * uViewMatrix2 * aPosition;
    gl_Position.x = -gl_Position.x;
}`;


const commonFragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec4 vColor;

out vec4 fragColor;

void main()
{
    fragColor = vColor;
}`;

const gl = document.querySelector('canvas').getContext('webgl2');
const makeProgram = (vSrc, fSrc) => {
    const prog = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vSrc);
    gl.compileShader(vertexShader);
    gl.attachShader(prog, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fSrc);
    gl.compileShader(fragmentShader);
    gl.attachShader(prog, fragmentShader);

    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    return prog;
};
const boxProgram = makeProgram(boxVertexShaderSrc, commonFragmentShaderSrc);
const mainProgram = makeProgram(mainVertexShaderSrc, commonFragmentShaderSrc);
const mainVAO = gl.createVertexArray();
const secondaryVAO = gl.createVertexArray();
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const loadCube = () => {
    const texData = new Uint8Array([
        0,1,1,
        1,0,1,
        0,1,0,
        1,1,0,
        0,0,1,
        1,0,0,
        0,0,0,
        0,0,0,
    ]).map(v => v * 255);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 8,1,0, gl.RGB, gl.UNSIGNED_BYTE, texData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    return new Float32Array([
        -.5,-.5,-.5,   0,1,1,   1/16,0.5,
        -.5, .5, .5,   0,1,1,   1/16,0.5,
        -.5, .5,-.5,   0,1,1,   1/16,1.5,
        -.5,-.5, .5,   0,1,1,   1/16,0.5,
        -.5, .5, .5,   0,1,1,   1/16,0.5,
        -.5,-.5,-.5,   0,1,1,   1/16,0.5,

        .5 ,-.5,-.5,   1,0,1,   3/16,0.5,
        .5 , .5,-.5,   1,0,1,   3/16,0.5,
        .5 , .5, .5,   1,0,1,   3/16,0.5,
        .5 , .5, .5,   1,0,1,   3/16,0.5,
        .5 ,-.5, .5,   1,0,1,   3/16,0.5,
        .5 ,-.5,-.5,   1,0,1,   3/16,0.5,

        -.5,-.5,-.5,   0,1,0,   5/16,0.5,
         .5,-.5,-.5,   0,1,0,   5/16,0.5,
         .5,-.5, .5,   0,1,0,   5/16,0.5,
         .5,-.5, .5,   0,1,0,   5/16,0.5,
        -.5,-.5, .5,   0,1,0,   5/16,0.5,
        -.5,-.5,-.5,   0,1,0,   5/16,0.5,

        -.5, .5,-.5,   1,1,0,   7/16,0.5,
         .5, .5, .5,   1,1,0,   7/16,0.5,
         .5, .5,-.5,   1,1,0,   7/16,0.5,
        -.5, .5, .5,   1,1,0,   7/16,0.5,
         .5, .5, .5,   1,1,0,   7/16,0.5,
        -.5, .5,-.5,   1,1,0,   7/16,0.5,

         .5,-.5,-.5,   0,0,1,   9/16,0.5,
        -.5,-.5,-.5,   0,0,1,   9/16,0.5,
         .5, .5,-.5,   0,0,1,   9/16,0.5,
        -.5, .5,-.5,   0,0,1,   9/16,0.5,
         .5, .5,-.5,   0,0,1,   9/16,0.5,
        -.5,-.5,-.5,   0,0,1,   9/16,0.5,

        -.5,-.5, .5,   1,0,0,   11/16,0.5,
         .5,-.5, .5,   1,0,0,   11/16,0.5,
         .5, .5, .5,   1,0,0,   11/16,0.5,
         .5, .5, .5,   1,0,0,   11/16,0.5,
        -.5, .5, .5,   1,0,0,   11/16,0.5,
        -.5,-.5, .5,   1,0,0,   11/16,0.5,
    ]);
};
const loadCamera = async () => {
    const colors = new Uint8Array([
        0x00, 0x00, 0x00,
        0xcf, 0xd8, 0xdc,
        0x21, 0x21, 0x21,
        0x54, 0x6e, 0x79,
        0xbd, 0xbd, 0xbd,
        0x75, 0x75, 0x75,
        0x54, 0x6e, 0x79,
        0x37, 0x47, 0x4f,
    ]);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 8,1,0, gl.RGB, gl.UNSIGNED_BYTE, colors);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    const file = await fetch('./camera2.bin');
    const arrayBuffer = await file.arrayBuffer();
    return arrayBuffer;
};


const createBoxRenderer = () => {
    const verts = new Float32Array([
        -1, 1,-1,       0,0,0,.4,
        -1,-1,-1,       0,0,0,.4,
        -1, 1, 1,       0,0,0,.4,
        -1,-1, 1,       0,0,0,.4,
        -1, 1, 1,       0,0,0,.4,
        -1,-1,-1,       0,0,0,.4,

        1 ,-1,-1,       0,0,0,.4,
        1 , 1,-1,       0,0,0,.4,
        1 , 1, 1,       0,0,0,.4,
        1 , 1, 1,       0,0,0,.4,
        1 ,-1, 1,       0,0,0,.4,
        1 ,-1,-1,       0,0,0,.4,

        -1,-1,-1,       0,0,0,.4,
        1, -1,-1,       0,0,0,.4,
        1, -1, 1,       0,0,0,.4,
        1, -1, 1,       0,0,0,.4,
        -1,-1, 1,       0,0,0,.4,
        -1,-1,-1,       0,0,0,.4,

        1,  1,-1,       0,0,0,.4,
        -1, 1,-1,       0,0,0,.4,
        1,  1, 1,       0,0,0,.4,
        -1, 1, 1,       0,0,0,.4,
        1,  1, 1,       0,0,0,.4,
        -1, 1,-1,       0,0,0,.4,

        1, -1,-1,       0,0,0,.3,
        -1,-1,-1,       0,0,0,.3,
        1,  1,-1,       0,0,0,.3,
        -1, 1,-1,       0,0,0,.3,
         1, 1,-1,       0,0,0,.3,
        -1,-1,-1,       0,0,0,.3,

        -1,-1, 1,       0,0,0,.8,
        1, -1, 1,       0,0,0,.8,
        1,  1, 1,       0,0,0,.8,
         1, 1, 1,       0,0,0,.8,
        -1, 1, 1,       0,0,0,.8,
        -1,-1, 1,       0,0,0,.8,
    ]);

    const vMatLoc2 = gl.getUniformLocation(boxProgram, 'uViewMatrix2');
    const pMatLoc2 = gl.getUniformLocation(boxProgram, 'uProjectionMatrix2');

    const vertBuff = gl.createBuffer();
    gl.bindVertexArray(secondaryVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuff);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.bindVertexArray(null);

    const draw = (vMat2, pMat2) => {
        gl.useProgram(boxProgram);

        gl.uniformMatrix4fv(vMatLoc2, false, vMat2);
        gl.uniformMatrix4fv(pMatLoc2, false, pMat2);

        gl.bindVertexArray(secondaryVAO);
        gl.depthMask(false);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK)

        // Draw back faces first
        gl.cullFace(gl.FRONT);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        // Draw front faces last
        gl.cullFace(gl.BACK);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        gl.depthMask(true);
        gl.disable(gl.CULL_FACE);
        gl.bindVertexArray(null);
    };

    return draw;
};

const createObjectRenderer = async () => {
    // const data = await loadCube();
    const data = await loadCamera();

    const mMatLoc = gl.getUniformLocation(mainProgram, 'uModelMatrix');
    const vMatLoc = gl.getUniformLocation(mainProgram, 'uViewMatrix');
    const pMatLoc = gl.getUniformLocation(mainProgram, 'uProjectionMatrix');
    const vMatLoc2 = gl.getUniformLocation(mainProgram, 'uViewMatrix2');
    const pMatLoc2 = gl.getUniformLocation(mainProgram, 'uProjectionMatrix2');
    const secondaryLoc = gl.getUniformLocation(mainProgram, 'uUseSecondaryViewProjection');

    const mainBuffer = gl.createBuffer();
    gl.bindVertexArray(mainVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, mainBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // BIN float data is in the format: pX pY pZ nX nY nZ u v
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 24);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.bindVertexArray(null);

    const mMat = mat4.create();
    mat4.rotateZ(mMat, mMat, .1);
    mat4.scale(mMat, mMat, [.6, .6, .6]);
    // mat4.translate(mMat, mMat, [0,0,-2]);


    const vMat = mat4.create();
    mat4.lookAt(vMat, [1,1,1], [0,0,0], [0,1,0]);

    const pMat = mat4.create();
    mat4.perspective(pMat, Math.PI / 2, gl.canvas.width / gl.canvas.height * 2, .1, 4);
    // mat4.ortho(pMat, -2,2,  -2,2,  -2,2);

    const draw = (vMat2, pMat2, useSecondaryViewProjection) => {
        gl.useProgram(mainProgram);

        gl.uniformMatrix4fv(mMatLoc, false, mMat);
        gl.uniformMatrix4fv(vMatLoc, false, vMat);
        gl.uniformMatrix4fv(pMatLoc, false, pMat);
        gl.uniformMatrix4fv(vMatLoc2, false, vMat2);
        gl.uniformMatrix4fv(pMatLoc2, false, pMat2);
        gl.uniform1i(secondaryLoc, useSecondaryViewProjection ? 1 : 0);

        gl.bindVertexArray(mainVAO);
        gl.drawArrays(gl.TRIANGLES, 0, data.byteLength / 32);
        gl.bindVertexArray(null);
    };

    const update = () => {
        mat4.rotate(mMat, mMat, 0.02, [0,-2,3]);
    };
    return [draw, update];
};

const loadSettings = () => {
    let s = 2;
    let h = Math.PI;
    let v = 0;

    const data = localStorage.getItem(PROJECTION_STORAGE_NAME);

    if (data !== null) {
        ({ h, v, s } = JSON.parse(data) ?? { h, v, s });
    }

    return { h,v, s };
};
const storeSettings = ({h,v,s}) => {
    localStorage.setItem(PROJECTION_STORAGE_NAME, JSON.stringify({ h, v, s }));
};

const createSliders = () => {
    let { h, v, s } = loadSettings();

    const createSlider = (setterFn, val, min='-1', max='1') => {
        const handler = (evt) => {
            clearTimeout(timeout);
            setterFn(evt.target.value);
            timeout = setTimeout(() => storeSettings({h,v,s}), 500);
        };

        let timeout = null;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = '.05';
        slider.value = val.toString();
        slider.addEventListener('mousemove', handler);
        slider.addEventListener('change', handler);

        return slider;
    };

    document.body.append(createSlider((value) => h = parseFloat(value), h, '0', (2 * Math.PI).toString()));
    document.body.append(createSlider((value) => v = parseFloat(value), v, (-.6 * Math.PI).toString(), (.6 * Math.PI).toString()));
    document.body.append(createSlider((value) => s = parseFloat(value), s,'1.5','10'));

    return () => ({ s, h, v });
};

const main = async () => {
    const getSettings = createSliders();

    const [drawMain, updateMain] = await createObjectRenderer();
    const drawBox = createBoxRenderer();

    // Bottom visualization
    const viewMatrix2 = mat4.create();
    const projMatrix2 = mat4.create();

    mat4.perspective(projMatrix2, Math.PI / 3, gl.canvas.width/gl.canvas.height * 2, .001, 10000);
    const animate = () => {
        requestAnimationFrame(animate);
        const { h, v, s } = getSettings();

        updateMain();

        mat4.lookAt(viewMatrix2, [0,0,s*2], [0,0,0], [0,1,0]);
        mat4.rotateX(viewMatrix2, viewMatrix2, v);
        mat4.rotateY(viewMatrix2, viewMatrix2, h);

        gl.viewport(0,gl.canvas.height/ 2,gl.canvas.width, gl.canvas.height/2);
        drawMain(viewMatrix2, projMatrix2, false);

        gl.viewport(0,0,gl.canvas.width, gl.canvas.height/2);
        drawMain(viewMatrix2, projMatrix2, true);
        drawBox(viewMatrix2, projMatrix2);
    };
    animate();
};

main();

