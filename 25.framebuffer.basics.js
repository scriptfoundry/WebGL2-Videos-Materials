// PART 1: INITIALIZATION

// Step 1: Prepare the environment

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

// We'll be using transparency when rendering the second
// program. We'll enable blending before its draw call and
// disable it after, but we can set the blending function
// here now since it will never change.
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


// Multiple programs are needed, so let's abstract the
// creation process
const createProgram = (gl, vs, fs) => {
    const program = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);
    gl.attachShader(program, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    return program;
};




// Step 2: Create the triangle program and configure its buffers
const triangleVerexShaderSource =
`#version 300 es
#pragma vscode_glsllint_stage: vert

uniform vec2 offset;

layout(location=0) in vec4 aPosition;
layout(location=1) in vec4 aColor;

out vec4 vColor;

void main()
{
    vColor = aColor;
    gl_Position = aPosition + vec4(offset, 0.0, 0.0);
}`;

const triangleFragmentShaderSource =
`#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec4 vColor;

layout(location=0) out vec4 fragColor;
layout(location=1) out vec4 solidColor;

void main()
{
    fragColor = vColor;
    solidColor = vec4(0.0, 1.0, 0.0, 1.0);
}`;

const triangleProgram = createProgram(gl, triangleVerexShaderSource, triangleFragmentShaderSource);

const triangleData = new Float32Array([
    // Pos (xyz)        // Color (rgb)
	-.5,-.5, -.5,       0,0,1,
    0.5,-.5, -.5,       0,0,1,
    0.0,0.4, -.5,       0,0,1,

    -.5,0.5, 0.5,       1,0,0,
    0.5,0.5, 0.5,       1,0,0,
    0.0,-.4, 0.5,       1,0,0,

]);

// Two programs? Use vertex array objects. They will
// allow you to easily and instantly bind the buffers
// you need before you issue your draw calls.
const triangleVAO = gl.createVertexArray();
gl.bindVertexArray(triangleVAO);

const triangleBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleData, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

gl.bindVertexArray(null);

// And get the uniform location in the first program of its `offset` uniform
const offsetUniformLocation = gl.getUniformLocation(triangleProgram, 'offset');

// Step 3: Create the (emtpy) texture
const fragColorTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fragColorTexture);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 480, 480);

const solidColorTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, solidColorTexture);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 480, 480);

gl.bindTexture(gl.TEXTURE_2D, null);

const renderbuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 480, 480);
gl.bindRenderbuffer(gl.RENDERBUFFER, null);


// Step 5: Add the quad program and configure its buffers
const quadVertexShaderSource =
`#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

out vec2 vTexCoord;

void main()
{
    gl_Position = aPosition;
    vTexCoord = aTexCoord;
}`;


const quadFragmentShaderSource =
`#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform sampler2D sampler;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
    fragColor = texture(sampler, vTexCoord);
}`;

const quadProgram = createProgram(gl, quadVertexShaderSource, quadFragmentShaderSource);

const quadData = new Float32Array([
    // Pos (xy)         // UV coordinate
    -1,1,               0,1,
    -1,-1,              0,0,
    1,1,                1,1,
    1,-1,               1,0,
]);

const quadVAO = gl.createVertexArray();
gl.bindVertexArray(quadVAO);

const quadBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

gl.bindVertexArray(null);


// Step 5: Initialize the framebuffer
//   a) attach the two textures color attachments
//   b) attach the depth buffer renderbuffer
//   c) tell WebGL which outputs to draw
const fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fragColorTexture, 0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, solidColorTexture, 0);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

gl.drawBuffers([ gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1 ]);

gl.bindFramebuffer(gl.FRAMEBUFFER, null);


//PART 2: ANIMATE & RENDER
let angle = 0;
const animate = () => {
    angle += 0.05;

    // Step 1: Draw the first triangle to the FBO with depth testing enabled
    gl.useProgram(triangleProgram);
    gl.uniform2f(offsetUniformLocation, Math.cos(angle), Math.sin(angle));
    gl.bindVertexArray(triangleVAO);
    gl.enable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);

    // Step 2: Draw the quad and pick a texture to render
    gl.useProgram(quadProgram);
    gl.bindVertexArray(quadVAO);
    gl.bindTexture(gl.TEXTURE_2D, fragColorTexture); // fragColorTexture or solidColorTexture
    gl.enable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);

    requestAnimationFrame(animate);
};
animate();