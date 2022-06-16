/*
    This demonstrates a basic example of a spotlight WebGL program. It
    simply uses a user-facing rectangle without any transformations and a
    static spotlight with static cutoff values pointed straight at the
    rectangle.

    In the JavaScript, experiment by changing the light position, light
    direction and cuttoff angles.

    This example does not include any model-view-matrix transformations, but
    feel free to add them. Remember to apply the View transformation to your
    light position and light direction as well as the vertex positions as 
    your light source and object geometry should exist in the same coordinate
    space.
*/
const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert


layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;

out vec3 vNormal;
out vec3 vPosition;

void main()
{
    vNormal = aNormal;
    gl_Position = aPosition;
    vPosition = aPosition.xyz;
}`;

const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform vec3 uLightPosition;
uniform vec3 uLightDirection;
uniform float uLightInnerCutoff;
uniform float uLightOuterCutoff;

in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

void main()
{
    vec3 offset = uLightPosition - vPosition;
    vec3 surfaceToLight = normalize(offset);

    float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));
    float angleToSurface = dot(uLightDirection, -surfaceToLight);
    float spot = smoothstep(uLightOuterCutoff, uLightInnerCutoff, angleToSurface);

    float brightness = diffuse * spot;

    fragColor.rgb = vec3(1.0, 0.0, 0.0) * brightness;
    fragColor.a = 1.0;
}`;

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const program = gl.createProgram();

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);
gl.attachShader(program, vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
}

gl.useProgram(program);

const verts = new Float32Array([
    -.75,-.75,0,  0,0,-1,
     .75,-.75,0,  0,0,-1,
     .75, .75,0,  0,0,-1,
    -.75,-.75,0,  0,0,-1,
     .75, .75,0,  0,0,-1,
    -.75, .75,0,  0,0,-1,
]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

gl.uniform3f(gl.getUniformLocation(program, 'uLightPosition'), 0.0, 0.0, -.5);
gl.uniform3f(gl.getUniformLocation(program, 'uLightDirection'), 0.0, 0.0, 1.0);
gl.uniform1f(gl.getUniformLocation(program, 'uLightInnerCutoff'), Math.cos(Math.PI / 12));
gl.uniform1f(gl.getUniformLocation(program, 'uLightOuterCutoff'), Math.cos(Math.PI / 6));

gl.drawArrays(gl.TRIANGLES, 0, 6);