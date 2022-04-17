/* Added features in this version over version 4:
    1. smooth shading
    2. brightness calculation in fragment shader
*/

import { glMatrix, mat3, mat4, vec3 } from 'gl-matrix';

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform mat4 uModelMatrix;

layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;

out vec3 vNormal;

void main()
{
    vNormal = aNormal;
    gl_Position = uModelMatrix * aPosition;
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform vec3 uLightDirection;
uniform mat4 uInverseTranspose;

in vec3 vNormal;

out vec4 fragColor;

vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

void main()
{
    float brightness = max(dot(uLightDirection, normalize(mat3(uInverseTranspose) * vNormal)), 0.0);
    fragColor = (color * .4) + (color * brightness * .6);
    fragColor.a = 1.0;
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
    // tslint:disable: no-console
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
    // tslint:enable: no-console
}
gl.useProgram(program);

// Prevent back surfaces from covering forward surfaces
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

const loadObject = async () => {
    const file = await fetch('./icosphere.PNT.bin');
    const arrayBuffer = await file.arrayBuffer();
    return arrayBuffer;
};

const main = async () => {
    const object = await loadObject();

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, object, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);

    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 0); // use smooth shading + lumpy
    // gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12); // OR flat shading

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    const lightDirectionLoc = gl.getUniformLocation(program, 'uLightDirection');
    const lightDirection = vec3.fromValues(1, 1, 1);
    vec3.normalize(lightDirection, lightDirection);

    const modelMatrixLoc = gl.getUniformLocation(program, 'uModelMatrix');
    const modelMatrix = mat4.create();

    const inverseTransposeLoc = gl.getUniformLocation(program, 'uInverseTranspose');
    const inverseTranspose = mat4.create();

    const draw = () => {
        // Rotate the light:
        // vec3.rotateY(lightDirection, lightDirection, [0,0,0], 0.02);

        // Rotate the model:
        mat4.rotateY(modelMatrix, modelMatrix, 0.02);

        // Squash the model:
        // mat4.scale(modelMatrix, modelMatrix, [1, 1, .99]);

        mat4.invert(inverseTranspose, modelMatrix);
        mat4.transpose(inverseTranspose, inverseTranspose);

        gl.uniform3fv(lightDirectionLoc, lightDirection);
        gl.uniformMatrix4fv(modelMatrixLoc, false, modelMatrix);
        gl.uniformMatrix4fv(inverseTransposeLoc, false, inverseTranspose);

        gl.drawArrays(gl.TRIANGLES, 0, object.byteLength / 32);

        requestAnimationFrame(draw);
    };

    draw();
};
main();
