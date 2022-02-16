// tslint:disable:no-console
const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in vec4 aColor;

out vec4 vColor;

void main()
{
    vColor = aColor;
    gl_Position = aPosition;
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec4 vColor;

out vec4 fragColor;

void main()
{
    fragColor = vColor;
}`;

const depthVertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
	vTexCoord = aTexCoord;
	gl_Position = vec4(aPosition.xy, 1.0, 1.0);
}`;
const depthFragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision highp float;
precision highp int;

uniform sampler2D uSampler;
in vec2 vTexCoord;

out highp vec4 pc_fragColor;

void main() {
	float depth = texture(uSampler, vTexCoord).r;
	pc_fragColor = vec4(vec3(pow(depth, 2.0)), 1.0);
}`;

const gl = document.querySelector('canvas').getContext('webgl2');

const prepareDepthVisualizer = () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height / 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height / 2);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
};

const createProgram = (vSource, fSource) => {
    const program = gl.createProgram();

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vSource);
    gl.compileShader(vertexShader);
    gl.attachShader(program, vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }
    gl.useProgram(program);
    return program;
};

const vertexData = new Float32Array([
    // x  y     depth    rgb         alpha
    // RED TRIANGLE (Back)
    -.5, -.5,   0.5,     1,0,0,      0.5,
    0.5, 0.0,   0.5,     1,0,0,      0.5,
    -.5, 0.5,   0.5,     1,0,0,      0.5,

    // BLUE TRIANGLE (Front)
    -.5, -.5,   -.5,     0,0,1,      0.5,
    0.0, 0.5,   -.5,     0,0,1,      0.5,
    0.5, -.5,   -.5,     0,0,1,      0.5,

    // GREEN TRIANGLE (Middle)
    0.5, -.5,   0.0,     0,1,0,      0.5,
    -.5, 0.0,   0.0,     0,1,0,      0.5,
    0.5, 0.5,   0.0,     0,1,0,      0.5,
]);

const draw = () => {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.TRIANGLES, 0, 3); // RED
    gl.drawArrays(gl.TRIANGLES, 6, 3); // GREEN
    gl.drawArrays(gl.TRIANGLES, 3, 3); // BLUE
};

const main = () => {
    const { width, height } = gl.canvas;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);


    // Upper window
    gl.viewport(0,gl.canvas.height / 2, width, height / 2);

    // Draw normally
    const colorProgram = createProgram(vertexShaderSrc, fragmentShaderSrc);
    gl.useProgram(colorProgram);
    draw();

    // Lower window
    gl.viewport(0, 0, width, height / 2);

    // Draw again but to texture
    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, width, height / 2, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    const renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height / 2);

    const frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

    draw(); // Depth data now written to depth texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Draw depth texture to rectangle
    const depthViewData = new Float32Array([
        -1,-1,      0,0,
         1,-1,      1,0,
         -1, 1,      0,1,
         1, 1,      1,1,
    ]);

    const depthProgram = createProgram(depthVertexShaderSrc, depthFragmentShaderSrc);
    gl.useProgram(depthProgram);

    const depthViewBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, depthViewBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, depthViewData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

main();