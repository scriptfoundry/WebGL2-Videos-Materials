/*
    This is an example of a very basic particle system
    using transform feedback. 

    It's important to remember that not all particle
    systems *need* transform feedback. It's just a tool
    you can use when the number of particles grow very
    large. This animation could have been done entirely
    in JavaScript, but you would run out of CPU capcity
    and saturate your bandwidth on most hardware.
*/

const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert

uniform float uRandom;

layout(location=0) in float aAge;
layout(location=1) in float aLifespan;
layout(location=2) in vec2 aPosition;
layout(location=3) in vec2 aVelocity;

out float vAge;
out float vLifespan;
out vec2 vPosition;
out vec2 vVelocity;
out float vHealth;

/* From TheBookOfShaders, chapter 10. This is a slightly upscaled implementation
 of the algorithm:
    r = Math.cos(aReallyHugeNumber);
 except it attempts to avoid the concentration of values around 1 and 0 by 
 multiplying by a very large irrational number and then discarding the result's
 integer component. Acceptable results. Other deterministic pseudo-random number 
 algorithms are available (including random textures).
*/
float rand2(vec2 source)
{
    return fract(sin(dot(source.xy, vec2(1.9898,1.2313))) * 42758.5453123);
} 

void main()
{
    if (aAge == aLifespan)
    {
        float s  = float(gl_VertexID);
        float r1 = rand2(vec2(s, uRandom));
        float r2 = rand2(vec2(r1, uRandom));
        float r3 = rand2(vec2(uRandom, r1 * uRandom));

        vec2 direction = vec2(cos(r1 * 2.0 + .57), sin(r1 * 2.0 + .57)); // Unit vector, mostly pointing upward
        float energy = .2 + r2; // particles with very little energy will never be visible, so always give them something.
        vec2 scale = vec2(.05, .3); // direction*energy gives too strong a value, so we scale this to fit the screen better.

        // use values above to calculate velocity
        vVelocity = direction * energy * scale;

        // Particles will be emitted from below the frame
        vPosition = vec2(.5 - r1, -1.1);

        vAge = -r3 * .01;
        vLifespan = aLifespan;
    }
    else
    {
        // Note that even values you **arn't** updating
        // must be assigned to the varying or else the 
        // value will be 0 in the next draw call.
        vec2 gravity = vec2(0.0, -0.02);

        vVelocity = aVelocity + gravity;
        vPosition = aPosition + vVelocity;
        vAge = min(aLifespan, aAge + .05);
        vLifespan = aLifespan;
    }

    vHealth = 1.0 - (vAge / vLifespan);
    
    gl_Position = vec4(vPosition, 0.0, 1.0);
    gl_PointSize = 5.0 * (1.0 - vAge);
}`;

const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in float vHealth;

out vec4 fragColor;

void main()
{
    // Point primitives are considered to have a width and
    // height of 1 and the center is at (.5, .5). So if we
    // discard fragments beyond this distance, we get a
    // point primitive shaped like a disc.

    float distanceFromPointCenter = distance(gl_PointCoord.xy, vec2(0.5));
    if (distanceFromPointCenter > .5) discard;

    fragColor = vec4(.3, 0.4, 0.8, vHealth);
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

// This line tells WebGL that these four output varyings should
// be recorded by transform feedback and that we're using a single
// buffer to record them.
gl.transformFeedbackVaryings(program, ['vAge', 'vLifespan', 'vPosition', 'vVelocity'], gl.INTERLEAVED_ATTRIBS);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
    console.log(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// This is the number of primitives we will draw
const COUNT = 1000000;

// Initial state of the input data. This "seeds" the
// particle system for its first draw.
let initialData = new Float32Array(COUNT * 6);
for (let i = 0; i < COUNT * 6; i += 6) {
    const px = Math.random() * 2 - 1;
    const age = Math.random() * -3 + .75;
    const lifespan = Math.random() * 3 + 1;

    initialData.set([
        age,                    // vAge
        lifespan,               // vLifespan
        px, -1.1,               // vPosition
        0,0,                    // vVelocity
    ], i);

}


// Describe our first buffer for when it is used a vertex buffer
const buffer1 = gl.createBuffer();
const vao1 = gl.createVertexArray();
gl.bindVertexArray(vao1);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
gl.bufferData(gl.ARRAY_BUFFER, 6 * COUNT * 4, gl.DYNAMIC_COPY);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, initialData);
gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 4);
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 8);
gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 24, 16);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.enableVertexAttribArray(2);
gl.enableVertexAttribArray(3);

// Initial data is no longer needed, so we can clear it now.
initialData = null;

// Buffer2 is identical but does not need initial data
const buffer2 = gl.createBuffer();
const vao2 = gl.createVertexArray();
gl.bindVertexArray(vao2);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
gl.bufferData(gl.ARRAY_BUFFER, 6 * COUNT * 4, gl.DYNAMIC_COPY);
gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 4);
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 8);
gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 24, 16);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.enableVertexAttribArray(2);
gl.enableVertexAttribArray(3);

// Clean up after yourself
gl.bindVertexArray(null);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

// This code should NOT be used, since we are using a single
// draw call to both UPDATE our particle system and DRAW it.
// gl.enable(gl.RASTERIZER_DISCARD);


// We have two VAOs and two buffers, but one of each is
// ever active at a time. These variables will make sure
// of that.
let vao = vao1;
let buffer = buffer1;
let time = 0;

const uRandomLocation = gl.getUniformLocation(program, 'uRandom');

// When we call `gl.clear(gl.COLOR_BUFFER_BIT)` WebGL will
// use this color (100% black) as the background color.
gl.clearColor(0,0,0,1);

const draw = () => {
    // schedule the next draw call
    requestAnimationFrame(draw);

    // It often helps to send a single (or multiple) random
    // numbers into the vertex shader as a uniform.
    gl.uniform1f(uRandomLocation, Math.random());
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Bind one buffer to ARRAY_BUFFER and the other to TFB
    gl.bindVertexArray(vao);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);

    // Perform transform feedback and the draw call
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    gl.endTransformFeedback();

    // Clean up after ourselves to avoid errors.
    gl.bindVertexArray(null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    // If we HAD skipped the rasterizer, we would have turned it
    // back on here too.
    // gl.disable(gl.RASTERIZER_DISCARD);

    // Swap the VAOs and buffers
    if (vao === vao1) {
        vao = vao2;
        buffer = buffer1;
    } else {
        vao = vao1;
        buffer = buffer2;
    }
};
draw();
