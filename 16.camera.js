// tslint:disable: no-console

import { mat4 } from 'gl-matrix';

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

layout(location=0) in vec4 aPosition;
layout(location=1) in vec4 aColor;

out vec4 vColor;

void main()
{
    vColor = aColor;
    gl_Position = uProjection * uView * uModel * aPosition;
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

gl.enable(gl.DEPTH_TEST);

const vertexData = new Float32Array([
    -.5,-.5,-.5,   0,1,1,
    -.5, .5, .5,   0,1,1,
    -.5, .5,-.5,   0,1,1,
    -.5,-.5, .5,   0,1,1,
    -.5, .5, .5,   0,1,1,
    -.5,-.5,-.5,   0,1,1,

    .5 ,-.5,-.5,   1,0,1,
    .5 , .5,-.5,   1,0,1,
    .5 , .5, .5,   1,0,1,
    .5 , .5, .5,   1,0,1,
    .5 ,-.5, .5,   1,0,1,
    .5 ,-.5,-.5,   1,0,1,

    -.5,-.5,-.5,   0,1,0,
     .5,-.5,-.5,   0,1,0,
     .5,-.5, .5,   0,1,0,
     .5,-.5, .5,   0,1,0,
    -.5,-.5, .5,   0,1,0,
    -.5,-.5,-.5,   0,1,0,

    -.5, .5,-.5,   1,1,0,
     .5, .5, .5,   1,1,0,
     .5, .5,-.5,   1,1,0,
    -.5, .5, .5,   1,1,0,
     .5, .5, .5,   1,1,0,
    -.5, .5,-.5,   1,1,0,

     .5,-.5,-.5,   0,0,1,
    -.5,-.5,-.5,   0,0,1,
     .5, .5,-.5,   0,0,1,
    -.5, .5,-.5,   0,0,1,
     .5, .5,-.5,   0,0,1,
    -.5,-.5,-.5,   0,0,1,

    -.5,-.5, .5,   1,0,0,
     .5,-.5, .5,   1,0,0,
     .5, .5, .5,   1,0,0,
     .5, .5, .5,   1,0,0,
    -.5, .5, .5,   1,0,0,
    -.5,-.5, .5,   1,0,0,
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

const modelLoc = gl.getUniformLocation(program, 'uModel');
const viewLoc = gl.getUniformLocation(program, 'uView');
const projectionLoc = gl.getUniformLocation(program, 'uProjection');

const model = mat4.create();
const view = mat4.create();
const projection = mat4.create();

mat4.rotateZ(model, model, .1);
mat4.scale(model, model, [.8, .8, .8]);

mat4.lookAt(view, [.6,.6,.6], [0,0,0], [0,1,0]);

// mat4.perspective(projection, Math.PI / 1.5, gl.canvas.width / gl.canvas.height, .1, 10);
mat4.ortho(projection, -1,1, -1,1, -1,2);

gl.uniformMatrix4fv(viewLoc, false, view);
gl.uniformMatrix4fv(projectionLoc, false, projection);

const draw = () => {
    requestAnimationFrame(draw);

    mat4.rotate(model, model, 0.02, [1,1,0]);
    gl.uniformMatrix4fv(modelLoc, false, model);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
};
draw();
