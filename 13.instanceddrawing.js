// tslint:disable: no-console
const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aOffset;
layout(location=2) in float aScale;
layout(location=3) in vec4 aColor;
layout(location=4) in vec2 aTexCoord;
layout(location=5) in float aDepth;

out vec2 vTexCoord;
out float vDepth;

void main()
{
    vTexCoord = aTexCoord;
    vDepth = aDepth;
    gl_Position = vec4(aPosition.xyz * aScale + aOffset, 1.0);
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform mediump sampler2DArray uSampler;

in vec2 vTexCoord;
in float vDepth;
out vec4 fragColor;

void main()
{
    fragColor = texture(uSampler, vec3(vTexCoord, vDepth));
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

const loadImage = () => new Promise(resolve => {
    const image = new Image();
    image.src = './kittenstacked.png';
    image.addEventListener('load', () => resolve(image));
});
const modelData = new Float32Array([
 // position    texCoord
    -1,-.7,     0,1,
    0,.8,       .5,0,
    1,-.7,      1,1,
]);
const transformData = new Float32Array([
 // offset     scale    color       depth
    -.2,.7,    .7,      1,0,0,      1,
    .3,-.5,    .4,      0,0,1,      0,
]);

const main = async () => {
    const image = await loadImage();
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, 256,256,2, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const modelBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(4);

    const transformBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, transformData, gl.STATIC_DRAW);

    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 8);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 28, 12);
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 28, 24);

    gl.vertexAttribDivisor(1,1);
    gl.vertexAttribDivisor(2,1);
    gl.vertexAttribDivisor(3,1);
    gl.vertexAttribDivisor(5,1);

    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);
    gl.enableVertexAttribArray(5);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 2);
};

main();