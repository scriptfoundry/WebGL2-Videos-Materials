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

uniform sampler2D sampler;

in vec3 vNormal;
in vec3 vPosition;

out vec4 fragColor;

struct Spotlight
{
    vec4 location;
    vec4 direction;
    vec4 angles;   // x = innerConeAngle, y = outerConeAngle
    vec4 texCoord; // xy = texCoord UV
};

layout(std140) uniform Lighting
{
    Spotlight spotlight[10];
};

void main()
{
    for (int x = 0; x < 10; x++)
    {
        vec3 offset = spotlight[x].location.xyz - vPosition;
        vec3 surfaceToLight = normalize(offset);
        float distance = length(surfaceToLight);
        float angleToSurface = dot(spotlight[x].direction.xyz, -surfaceToLight);
    
        float diffuse = max(0.0, dot(surfaceToLight, normalize(vNormal)));
        float attenuation = 1.0 / (distance * distance);
        float spot = smoothstep(spotlight[x].angles.x, spotlight[x].angles.y, angleToSurface);
    
        float brightness = spot * attenuation * diffuse;
    
        vec4 color = texture(sampler, spotlight[x].texCoord.xy) * brightness;
        fragColor += color;
    }

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

// Geometry (just one quad)
const quad = new Float32Array([
    // position           normal
    -.75, -.75, 0,        0,0,-1,
    0.75, -.75, 0,        0,0,-1,
    0.75, 0.75, 0,        0,0,-1,
    0.75, 0.75, 0,        0,0,-1,
    -.75, 0.75, 0,        0,0,-1,
    -.75, -.75, 0,        0,0,-1,
]);

const quadBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

// Light colours
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2,2,0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
    255,0,0,255,        0,255,0,255,        // red   green
    0,0,255,255,        255,255,255,255,    // blue  white
]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

const _ = 0;
const lightData = new Float32Array([
    // Chunk 1               Chunk 2                 Chunk 3
    // position              direction               innerCone outerCone texCoord
    0.500,0.000,-.200,_,     -.500,0.000,.125,_,     0.278,    0.362,_,_,    .25,.25,_,_,
    0.405,0.294,-.200,_,     -.405,-.294,.125,_,     0.322,    0.418,_,_,    .25,.75,_,_,
    0.155,0.476,-.200,_,     -.155,-.476,.125,_,     0.386,    0.501,_,_,    .75,.75,_,_,
    -.155,0.476,-.200,_,     0.155,-.476,.125,_,     0.273,    0.355,_,_,    .75,.25,_,_,
    -.405,0.294,-.200,_,     0.405,-.294,.125,_,     0.276,    0.359,_,_,    .25,.25,_,_,
    -.500,0.000,-.200,_,     0.500,-.000,.125,_,     0.345,    0.448,_,_,    .25,.75,_,_,
    -.405,-.294,-.200,_,     0.405,0.294,.125,_,     0.295,    0.383,_,_,    .75,.75,_,_,
    -.155,-.476,-.200,_,     0.155,0.476,.125,_,     0.300,    0.390,_,_,    .75,.25,_,_,
    0.155,-.476,-.200,_,     -.155,0.476,.125,_,     0.242,    0.315,_,_,    .25,.25,_,_,
    0.405,-.294,-.200,_,     -.405,0.294,.125,_,     0.365,    0.475,_,_,    .25,.75,_,_,
]);

const buffer = gl.createBuffer();
gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, buffer);
gl.bufferData(gl.UNIFORM_BUFFER, lightData, gl.STATIC_DRAW);
gl.uniformBlockBinding(program, gl.getUniformBlockIndex(program, 'Lighting'), 0);

gl.drawArrays(gl.TRIANGLES, 0, 6);