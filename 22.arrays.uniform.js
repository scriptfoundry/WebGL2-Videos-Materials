const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;

out vec3 vPosition;
out vec3 vNormal;

void main()
{
    gl_Position = aPosition;
    vPosition = gl_Position.xyz;
    vNormal = aNormal;
}`;

const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

// vec3 lightPosition = vec3(.5, .5, -1.1);

uniform vec3 uLightPositions[10];

void main()
{
    float brightness = 0.0;

    for (int i = 0; i < 10; i++)
    {
        vec3 offset = uLightPositions[i] - vPosition;
        vec3 surfaceToLight = normalize(offset);
        float distance = length(offset);
    
        float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));
        float attenuation = 0.0125 / (distance * distance);

        brightness += diffuse * attenuation;
    }
    
    fragColor = vec4(1.0, 0.0, 0.0, 1.0) * brightness;
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

const quad = new Float32Array([
    // Quad (part 1: ◢)
    // Positions          Normals
    -.75, -.75, 0,        0, 0, -1,
    0.75, -.75, 0,        0, 0, -1,
    0.75, 0.75, 0,        0, 0, -1,

    // Quad (part 2: ◤)
    0.75, 0.75, 0,        0, 0, -1,
    -.75, 0.75, 0,        0, 0, -1,
    -.75, -.75, 0,        0, 0, -1,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

const lightData = new Float32Array(30).map(() => Math.random() - .5);
gl.uniform3fv(gl.getUniformLocation(program, 'uLightPositions'), lightData);

gl.drawArrays(gl.TRIANGLES, 0, quad.byteLength / 24);
