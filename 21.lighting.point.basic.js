/*
    This demonstrates a basic example of a point light WebGL program. It
    simply uses a user-facing rectangle without any transformations and a
    static point light. I've included three attenuation programs:

      1. inverseSquare(distance)
      2. quadraticLinearConstant(distance, a, b, c)
      3. radius(distance, r)

    Uncomment the version you want to use and experiment. Also, change the 
    point light position.

    This example does not include any model-view-matrix transformations, but
    feel free to add them. Remember to apply the View transformation to your
    light position as well as the vertex positions as your light source and
    object geometry should exist in the same coordinate space.
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

in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

float inverseSquare(float distance)
{
    return 1.0 / (distance * distance);
}
float quadraticLinearConstant(float distance, float a, float b, float c)
{
    return 1.0 / (
        distance * distance * a +
        distance * b +
        c
    );
}
float radius(float distance, float radius)
{
    return (2.0 / (radius * radius)) * (1.0 - distance / sqrt(distance * distance + radius * radius));
}

void main()
{
    vec3 offset = uLightPosition - vPosition;
    vec3 surfaceToLight = normalize(offset);
    float distance = length(offset);

    float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));

    /*
      Select which attenuation function you want to use.
      Just uncomment the one you'd lie to use.
    */
    float attenuation = inverseSquare(distance);
    // float attenuation = quadraticLinearConstant(distance, .64, .77, .7);
    // float attenuation = radius(distance, 1.0);
    
    float brightness = diffuse * attenuation;

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

gl.drawArrays(gl.TRIANGLES, 0, 6);