// tslint:disable: no-console

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 1) in float aPointSize;
layout(location = 0) in vec2 aPosition;
layout(location = 2) in vec3 aColor;

out vec3 vColor;

void main()
{
    vColor = aColor;
    gl_PointSize = aPointSize;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 vColor;

out vec4 fragColor;

void main()
{
    fragColor = vec4(vColor, 1.0);
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

const bufferData = new Float32Array([
     0, 1,          100,        1,0,0,
    -1,-1,           32,        0,1,0,
     1,-1,           50,        0,0,1,
]);

const aPositionLoc = 0;
const aPointSizeLoc = 1;
const aColorLoc = 2;

gl.enableVertexAttribArray(aPositionLoc);
gl.enableVertexAttribArray(aPointSizeLoc);
gl.enableVertexAttribArray(aColorLoc);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 6 * 4, 0);
gl.vertexAttribPointer(aPointSizeLoc, 1, gl.FLOAT, false, 6 * 4, 2 * 4);
gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

gl.drawArrays(gl.TRIANGLES, 0, 3);