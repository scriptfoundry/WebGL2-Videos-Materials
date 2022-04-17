/* Added features in this version over previous version (HelloWorld.js):
    1. adding very basic brightness calculation
    2. ambient + diffuse shading
    3. animation of light source direction
*/

import { glMatrix, mat3, mat4, vec3 } from 'gl-matrix';

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform vec3 uLightDirection;

out float vBrightness;

vec3 normal = vec3(0.0, 0.0, -1.0);

void main()
{
    vBrightness = max(dot(uLightDirection, normal), 0.0);
    gl_PointSize = 200.0;
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in float vBrightness;

out vec4 fragColor;

vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

void main()
{
    fragColor = (color * .4) + (color * vBrightness * .6);
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

const lightDirectionLoc = gl.getUniformLocation(program, 'uLightDirection');
const lightDirection = vec3.fromValues(1, 1, 1);
vec3.normalize(lightDirection, lightDirection);

const draw = () => {
    // Rotate the light:
    vec3.rotateY(lightDirection, lightDirection, [0,0,0], 0.02);

    gl.uniform3fv(lightDirectionLoc, lightDirection);

    gl.drawArrays(gl.POINTS, 0, 1);

    requestAnimationFrame(draw);
};

draw();
