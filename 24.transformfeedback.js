const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in float input1;
layout(location=1) in float input2;

out float output1;
out float output2;

void main()
{
    output1 = input1 + .1;
    output2 = input2 + .2;
}`;

const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag

void main()
{
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

// This line tells WebGL that these two output varyings should
// be recorded by transform feedback.
gl.transformFeedbackVaryings(program, ['output1', 'output2'], gl.INTERLEAVED_ATTRIBS);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
}

gl.useProgram(program);

// This is the number of primitives we will draw
const COUNT = 1000;

// Initial state of the input data -- just the numbers 0-1999
const initialData = new Float32Array(COUNT * 2).map((v, i) => i);

// In this version of the code, we are using vertex array objects
// since they encapsulate the vertex array buffer binding automatically
// and simplify our draw call. But we don't have to. We could just 
// upload our initial data here to buffer1, allocate memory for buffer2
// and call `gl.vertexAttribPointer()` in our draw call.
const buffer1 = gl.createBuffer();
const vao1 = gl.createVertexArray();
gl.bindVertexArray(vao1);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
gl.bufferData(gl.ARRAY_BUFFER, 2 * COUNT * 4, gl.DYNAMIC_COPY);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, initialData);
gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 8, 0);
gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 8, 4);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

// Buffer2 is identical but does not need initial data
const buffer2 = gl.createBuffer();
const vao2 = gl.createVertexArray();
gl.bindVertexArray(vao2);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
gl.bufferData(gl.ARRAY_BUFFER, 2 * COUNT * 4, gl.DYNAMIC_COPY);
gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 8, 0);
gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 8, 4);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

// If you clean up after yourself, you may experience much
// fewer errors
gl.bindVertexArray(null);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

// Our fragment shader is empty, so this will silence any
// warnings WebGL gives us.
gl.enable(gl.RASTERIZER_DISCARD);


// We have two VAOs and two buffers, but one of each is
// ever active at a time. These variables will make sure
// of that.
let vao = vao1;
let buffer = buffer2;

for (let i = 0; i < 100; i++) {
    // Binding the VAO also will bind the vertex array buffer
    // to `ARRAY_BUFFER`. So this will be the input buffer for
    // our vertex shader.
    gl.bindVertexArray(vao);

    // Binding the buffer to T_F_B will designate that buffer
    // for output. Because we're not using `SEPARATE_ATTRIBS`,
    // and thus there's only one output buffer, we use the 
    // index value `0`.
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);

    // Begin transform feedback.
    gl.beginTransformFeedback(gl.POINTS);

    // Issue the draw call, which will also send the outputs to
    // the transform feedback buffer.
    gl.drawArrays(gl.POINTS, 0, 1000);

    // Ending transform feedback means the buffer can now be
    // used for other purposes... such as using it as the 
    // vertex array (input) buffer next time.
    gl.endTransformFeedback();

    // Clean up after ourselves to avoid errors.
    gl.bindVertexArray(null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    // Swap the VAOs and buffers
    if (vao === vao1) {
        vao = vao2;
        buffer = buffer1;
    } else {
        vao = vao1;
        buffer = buffer2;
    }
}

// In this case, we don't have any other working fragment shader
// but if we did, we would have to re-enable output by disabling
// RASTERIZER_DISCARD
gl.disable(gl.RASTERIZER_DISCARD);


// This code has nothing to do with transform feedback. It's
// just to confirm our buffers contain the data we think they
// do.
const getBufferContents = (buffer) => {
    // Consider this `sync` object as a flag. It will be dropped
    // into WebGL's instruction pipeline. When WebGL reaches
    // this sync object, it will set its status two one of FOUR
    // values.
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);

    const checkStatus = () => {
        // Get the status
        const status = gl.clientWaitSync(sync, gl.SYNC_FLUSH_COMMANDS_BIT, 0);

        if (status === gl.TIMEOUT_EXPIRED) {
            console.log('GPU is still busy. Let\'s wait some more.');
            setTimeout(checkStatus);
        } else if (status === gl.WAIT_FAILED) {
            console.error('Something bad happened and we won\'t get any response.');
        } else  {
            // This code will be reached if the status is either
            // CONDITION_SATISFIED or SIGNALED_ALREADY. We don't 
            // really care which status it is as long as one of
            // these was found. So we can safely read the buffer data
            // (assuming another draw call hasn't initiated more
            // changes....)
            const view = new Float32Array(2 * COUNT);
            gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer);
            gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, view);
            gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
            console.log(view);
        }
    };

    setTimeout(checkStatus);
};
getBufferContents(buffer1);
