// tslint:disable: no-console
import {mat4} from 'gl-matrix';

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform highp sampler2DArray uSampler;
precision highp float;

// Model attributes
layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aTexCoord;

// Transform (instance) attributes
layout(location=3) in mat4 aModelMatrix;
layout(location=7) in float aDepth;

out vec4 vColor;

void main()
{
    vColor = texture(uSampler, vec3(aTexCoord, aDepth));
    gl_Position = aModelMatrix * aPosition;
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec4 vColor;

out vec4 fragColor;

void main()
{
    fragColor = vColor;
}`;

const gl = document.querySelector('canvas').getContext('webgl2');

const program = gl.createProgram();

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSrc);
gl.compileShader(vertexShader);
gl.attachShader(program, vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSrc);
gl.compileShader(fragmentShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
}
gl.useProgram(program);


const loadModel = async () => {
    const req = await fetch('./viper2.bin');
    const buffer = await req.arrayBuffer();
    return new Float32Array(buffer);
};

const main = async () => {
    const modelData = await loadModel();

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA,  8,1,2,0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
        // tslint:disable: max-line-length
        0x00,0x00,0x00,0xff,    0x00,0x00,0x00,0xff,    0x37,0x47,0x4f,0xff,    0x60,0x7d,0x8b,0xff,    0xb0,0xbe,0xc5,0xff,    0x3f,0x51,0xb5,0xff,    0x64,0xb5,0xf6,0xff,    0xff,0xff,0x00,0xff,
        0x00,0x00,0x00,0xff,    0xf5,0xf5,0xf5,0xff,    0x88,0x47,0x4f,0xff,    0x60,0x7d,0x8a,0xff,    0x50,0x33,0x33,0xff,    0x82,0x2e,0x32,0xff,    0xa1,0x33,0x34,0xff,    0xff,0xfe,0x3d,0xff,
        // tslint:enable: max-line-length
    ]));
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    const modelBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);

    const transformData = new Float32Array([
        // 4x4Matrix (16 floats)                      texDepth
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          1,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          0,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          1,
        1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,          1,
    ]);

    const transformBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, transformData, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(7, 1, gl.FLOAT, false, 68, 64);
    gl.vertexAttribDivisor(7, 1);
    gl.enableVertexAttribArray(7);


    gl.vertexAttribPointer(3+0, 4, gl.FLOAT, false, 68, 0);
    gl.vertexAttribPointer(3+1, 4, gl.FLOAT, false, 68, 16);
    gl.vertexAttribPointer(3+2, 4, gl.FLOAT, false, 68, 32);
    gl.vertexAttribPointer(3+3, 4, gl.FLOAT, false, 68, 48);

    gl.vertexAttribDivisor(3, 1);
    gl.vertexAttribDivisor(4, 1);
    gl.vertexAttribDivisor(5, 1);
    gl.vertexAttribDivisor(6, 1);

    gl.enableVertexAttribArray(3);
    gl.enableVertexAttribArray(4);
    gl.enableVertexAttribArray(5);
    gl.enableVertexAttribArray(6);


    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.FRONT);

    gl.clearColor(0,0,.1,1);

    let step = 0;
    const draw = () => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);

        for (let i = 0; i < 16; i += 1) {
            const shipX = (i % 4) / 2 - .75;
            const shipY = (Math.floor(i / 4) / -2) + .75;

            const mat = mat4.create();
            mat4.translate(mat,mat, [shipX,shipY,0]);
            mat4.rotate(mat, mat, (step / 50) + i, [1 - i/19, 1 + i/21, .01 * i]);
            mat4.scale(mat,mat, [.125,.125,.125]);

            gl.bufferSubData(gl.ARRAY_BUFFER, 68 * i, mat);
        }
        step += 1;

        gl.drawArraysInstanced(gl.TRIANGLES, 0,2004, 16);
        requestAnimationFrame(draw);
    };
    draw();
};
main();
