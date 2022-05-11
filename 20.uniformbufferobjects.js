import { mat3, mat4, vec3 } from 'gl-matrix';

/*
    This is an example application demonstrating the
    use of Uniform Buffer Objects and std140. Ignore
    everything else and just focus on the UBO-related
    code.

    Look for "UBO Step 1/2/3".

    I'm using gl-matrix here, but you don't have to. Use
    something better and less verbose.
*/

/*
    UBO Step 1: Create uniform blocks in your shader source code

    Note that program1 and program2 share one UBO for blocks that
    use different names. program1 uses the block name `Camera` and
    program2 uses the block name `MVP`. But they are the same.
    Also note that program1 uses uniform names uModelMatrix,
    uViewMatrix, uProjectionMatrix, while program2 uses m, v, p.
    This demonstrates the these names do NOT have to be the same.
    The only thing that matters is that UBO uniform blocks must
    share the same datetypes in the same order.

    std140 memory layout:

    Lights: uses two chunks (includes padding):
    spot 0 is for the float (called uStrength)
    spots 1-3 are padding (to complete the first "chunk")
    spots 4-7 are for the vec3 (called uLightDirection)

    Camera uses 12 chunks (no padding):
    spots 1-16 are for the model matrix
    spots 17-32 are for the view matrix
    spots 33-48 are for the projection matrix

    Note that in real life, the Lights uniform buffers 
    would have no padding (by reversing uStrength &
    uLightDirection). It would make updates easier without
    becoming "UBO tetris".
*/

const prog1VertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(std140) uniform Lights {
    float uStrength;
    vec3 uLightDirection;
};
layout(std140) uniform Camera {
    mat4 uModelMatrix;
    mat4 uViewMatrix;
    mat4 uProjectionMatrix;
};

layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aTexCoord;

out vec2 vTexCoord;
out float vBrightness;

void main()
{
    mat4 modelViewMatrix = uViewMatrix * uModelMatrix;
    vec3 normal = normalize(vec3(modelViewMatrix) * aNormal);
    vBrightness = uStrength * max(dot(normalize(aNormal), normalize(uLightDirection)), 0.0);
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * modelViewMatrix * aPosition;
}`;

const prog1FragSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform sampler2D sampler;

in vec2 vTexCoord;
in float vBrightness;

out vec4 fragColor;

void main()
{
    vec4 color = texture(sampler, vTexCoord);
    fragColor = (color * .4) + (vBrightness * color * .8);
    fragColor.a = color.a;
}`;
const prog2VertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

// This uniform block has the same datatypes in
// the same order as "Camera" in the other vertex shader
// so sharing UBO buffer data is possible here.
layout(std140) uniform MVP {
    mat4 m;
    mat4 v;
    mat4 p;
};
layout(std140) uniform Lights {
    float uStrength;
    vec3 uLightDirection;
};

layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aNormal;

out float vBrightness;

void main()
{
    vBrightness = max(dot(normalize(aNormal), uLightDirection), 0.0);
    gl_Position = p * v * m * aPosition;
}`;

const prog2FragSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in float vBrightness;

out vec4 fragColor;

void main()
{
    fragColor = vBrightness * vec4(1.0, 0.0, 0.0, 1.0);
    fragColor.a = 0.5;
}`;

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const createProgram = (vertSrc, fragSrc) => {
    const program = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertSrc);
    gl.compileShader(vertexShader);
    gl.attachShader(program, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragSrc);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        // tslint:disable: no-console
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
        // tslint:enable: no-console
    }

    return program;
};

gl.enable(gl.DEPTH_TEST);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const program1 = createProgram(prog1VertexSrc, prog1FragSrc);
const program2 = createProgram(prog2VertexSrc, prog2FragSrc);

const model1Data = new Float32Array([
    // pos          norm        txcoord
    -.5,-.5,-.5,     0,0,-1,     .25,.25,
    .25,-.5,-.5,     0,0,-1,     .75,.25,
    .25,.25,-.5,     0,0,-1,     .75,.75,

    -.5,-.5,-.5,     0,0,-1,     .25,.25,
    .25,.25,-.5,     0,0,-1,     .75,.75,
    -.5,.25,-.5,     0,0,-1,     .25,.75,
]);
const buffer1 = gl.createBuffer();
const vao1 = gl.createVertexArray();
gl.bindVertexArray(vao1);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
gl.bufferData(gl.ARRAY_BUFFER, model1Data, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.enableVertexAttribArray(2);

const model2Data = new Float32Array([
    // pos          norm
    -.25,-.25,.5,  0,0,-1,
    0.50,-.25,.5,  0,0,-1,
    0.50,0.50,.5,  0,0,-1,

    -.25,-.25,.5,  0,0,-1,
    0.50,0.50,.5,  0,0,-1,
    -.25,0.50,.5,  0,0,-1,
]);
const vao2 = gl.createVertexArray();
gl.bindVertexArray(vao2);
const buffer2 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
gl.bufferData(gl.ARRAY_BUFFER, model2Data, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.bindVertexArray(null);

const textureData = new Uint8Array([
    0x00,0x96,0x88,0xff,
    0x00,0xAA,0xF1,0xff,
    0xFF,0xCC,0x85,0xff,
    0xE5,0x39,0x38,0xff,
]);
const texture1 = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture1);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2,2,0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

gl.useProgram(program1);

// Create data for uniforms
const lightDir = vec3.fromValues(1,1,-1);
vec3.normalize(lightDir, lightDir);

const modelMatrix = mat4.create();
const viewMatrix = mat4.lookAt(mat4.create(), [.75,.75,1], [0,0,0], [0,1,0]);
const projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 3, 1, .1, 10);

const PAD = -1; // value doesn't matter
const cameraData = new Float32Array([
    ...modelMatrix,
    ...viewMatrix,
    ...projectionMatrix,
]);
const lightsData = new Float32Array([
    1, PAD,PAD,PAD,  // light strenth (float+padding)
    ...lightDir,PAD  // light direction (vec3)
]);

// UBO Step 2: Create UBOs for the Camera & Lights unform blocks

// These constant values are completely arbitrary. You can choose
// almost ANY numbers you want, from 0 to the local hardward limit
// You can find this limit with:
// gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS)
const CAMERA_BINDING_POINT = 0;
const LIGHTS_BINDING_POINT = 1;

// Create buffer (you can do this at any point, but before bindBufferBase().)
const cameraBuffer = gl.createBuffer();
const lightsBuffer = gl.createBuffer();

// Bind buffer to the uniform buffer binding index ("binding point number")
// and since the buffer is also bound to gl.UNIFORM_BUFFER, you might as well
// upload your buffer data now (or allocate memory for the buffer data).
gl.bindBufferBase(gl.UNIFORM_BUFFER, CAMERA_BINDING_POINT, cameraBuffer);
// Upload data:
gl.bufferData(gl.UNIFORM_BUFFER, cameraData, gl.DYNAMIC_DRAW);

gl.bindBufferBase(gl.UNIFORM_BUFFER, LIGHTS_BINDING_POINT, lightsBuffer);
// Allocate memory only:
gl.bufferData(gl.UNIFORM_BUFFER, lightsData.byteLength, gl.DYNAMIC_DRAW);

// Bind EACH uniform block in EACH program to the uniform block binding index
// (binding point number).
gl.uniformBlockBinding(program1, gl.getUniformBlockIndex(program1, 'Camera'), CAMERA_BINDING_POINT);
gl.uniformBlockBinding(program1, gl.getUniformBlockIndex(program1, 'Lights'), LIGHTS_BINDING_POINT);

gl.uniformBlockBinding(program2, gl.getUniformBlockIndex(program2, 'MVP'), CAMERA_BINDING_POINT);
gl.uniformBlockBinding(program2, gl.getUniformBlockIndex(program2, 'Lights'), LIGHTS_BINDING_POINT);

// Initialization is complete.
// At this point, the binding point numbers, any references to the uniform block index
// any anything else that isn't the buffer or the buffer source data can be ignored.
// You only REALLY need to retain the buffer for your draw calls.

let step = 0;
const currentModelMatrix = mat4.create();

const draw = () => {
    // uViewMatrix is mat4 starting in fifth chunk
    mat4.rotate(currentModelMatrix, viewMatrix, Math.sin(step), [0,1,0]);
    cameraData.set(currentModelMatrix, 16);

    // uLightDirection is a vec3 in second chunk
    vec3.rotateY(lightDir, lightDir, [0,0,0], .05);
    lightsData.set(lightDir, 4);

    // UBO Step 3: Update the buffers (you can upload ENTIRE Float32Array
    // or only the part that changed)
    gl.bindBuffer(gl.UNIFORM_BUFFER, cameraBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, cameraData);
    // gl.bufferSubData(gl.UNIFORM_BUFFER, 16 * 4, currentModelMatrix);

    gl.bindBuffer(gl.UNIFORM_BUFFER, lightsBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, lightsData);

    // UBO code is all finished

    gl.useProgram(program1);
    gl.bindVertexArray(vao1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.enable(gl.BLEND);
    gl.useProgram(program2);
    gl.bindVertexArray(vao2);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);

    step += 0.01;
    requestAnimationFrame(draw);
};

draw();
