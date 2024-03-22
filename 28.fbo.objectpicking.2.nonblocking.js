const createWebGLProgram = (gl, vs, fs) => {
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

// All code for creating, managing and drawing the geometry is 
// inside this function. This is for clarity but is bad API design.
const createGeometryProgram = () => {
	const vertexShaderSource = `#version 300 es
		#pragma vscode_glsllint_stage: vert

		uniform float uShiftX;

		layout(location=0) in vec2 aOffset;
		layout(location=1) in vec4 aColor;

		flat out vec4 vColor;
		flat out int vInstanceID;

		void main()
		{
			gl_PointSize = 24.0;
			
			gl_Position = vec4(
				aOffset.x + .5 * cos(uShiftX),
				aOffset.y,
				0, 1);
			vColor = aColor;
			vInstanceID = gl_InstanceID;
		}
	`;

	const fragmentShaderSource = `#version 300 es
		#pragma vscode_glsllint_stage: frag

		precision mediump float;
		precision mediump int;    // so, 16-bits per int

		uniform int uSelectedInstanceID;

		flat in vec4 vColor;
		flat in mediump int vInstanceID; // 16 bits per value

		layout(location=0) out vec4 fragColor;
		layout(location=1) out int instanceID;

		void main()
		{
			if (uSelectedInstanceID == vInstanceID) {
				fragColor = vec4(1,0,0,1);
			} else {
				fragColor = vColor;
			}
			instanceID = vInstanceID;
		}
	`;	

	const colors = [
		[0.000, 0.600, 0.859, 1],
		[0.071, 0.306, 0.537, 1],
		[0.094, 0.078, 0.145, 1],
		[0.098, 0.235, 0.243, 1],
		[0.149, 0.169, 0.267, 1],
		[0.173, 0.910, 0.961, 1],
		[0.227, 0.267, 0.400, 1],
		[0.353, 0.412, 0.533, 1],
		[0.310, 0.782, 1.000, 1],
		[0.408, 0.220, 0.424, 1],
		[0.545, 0.608, 0.706, 1],
		[0.310, 0.314, 0.533, 1],
		[0.353, 0.796, 0.863, 1],
		[0.365, 0.459, 0.478, 1],
	];
	const instanceCount = 400;
	const instanceData = new Float32Array(instanceCount * 6);
	for (let i = 0, index = 0; i < instanceCount; i += 1, index += 6) {
		const row = ((i % 20) / 10) - .95;
		const col = (Math.floor(i / 20) / 10) - .95;
		const data = [row, col, ...colors[i % colors.length]];

		instanceData.set(data, index);
	}

	const program = createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource);
	
	const uSelectedInstanceIDLocation = gl.getUniformLocation(program, 'uSelectedInstanceID');
	const uShiftXLocation = gl.getUniformLocation(program, 'uShiftX');

	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const instanceBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
	gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8);
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.vertexAttribDivisor(0, 1);
	gl.vertexAttribDivisor(1, 1);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindVertexArray(null);

	let shift = 0;

	const draw = (selectedInstanceID) => {
		shift += .01;
		gl.useProgram(program);

		gl.uniform1i(uSelectedInstanceIDLocation, selectedInstanceID);
		gl.uniform1f(uShiftXLocation, shift);

		gl.bindVertexArray(vao);
		gl.drawArraysInstanced(gl.POINTS, 0, 1, 400);
		gl.bindVertexArray(null);		

		gl.useProgram(null);
	};

	return { draw };
};

// All code for creating, managing and drawing the quad is inside
// this function. (again, bad API design)
const createQuadProgram = () => {
	const vertexShaderSource = `#version 300 es
		#pragma vscode_glsllint_stage: vert

		layout(location=0) in vec4 aPosition;
		layout(location=1) in vec2 aTexCoord;

		out vec2 vTexCoord;

		void main()
		{
			gl_Position = aPosition;
			vTexCoord = aTexCoord;
		}
	`;

	const fragmentShaderSource = `#version 300 es
		#pragma vscode_glsllint_stage: frag

		precision mediump float;

		uniform sampler2D sampler;

		in vec2 vTexCoord;

		out vec4 fragColor;

		void main()
		{
			fragColor = texture(sampler, vTexCoord);
		}
	`;

	const program = createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource);
	const quadData = new Float32Array([
		// Pos (xy)         // UV coordinate
		-1, 1,              0,1,
		-1,-1,              0,0,
		 1, 1,              1,1,
		 1,-1,              1,0,
	]);
	const vertexCount = 4;

	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);

	gl.bindVertexArray(null);

	const draw = () => {
		gl.useProgram(program);
		gl.bindVertexArray(vao);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
		// gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
		gl.bindVertexArray(null);
	};

	return { draw };
};

const createFramebufferObject = () => {
	const colorTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 480,480);

	const instanceTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, instanceTexture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R16I, 480,480);

	const fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, instanceTexture, 0);

	gl.drawBuffers([ gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1 ]);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return fbo;
};

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const geometryProgram = createGeometryProgram();
const quadProgram = createQuadProgram();

const fbo = createFramebufferObject();

// The pixel buffer object is created here. In this case, we need room for a single
// pixel from an R16I texture, so a single 16-bit value, or two bytes. The usage value
// should be a `READ` type, possibly `DYNAMIC_READ`, but for object picking you'll 
// see `STREAM_READ` most often (we're writing to this buffer every frame, but reading
// only once per frame.)
const pbo = gl.createBuffer();
gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
gl.bufferData(gl.PIXEL_PACK_BUFFER, 2, gl.STREAM_READ);
gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

// Change this to change the selected object
let selectedInstanceID = -1; // -1 is not a valid instanceID, so nothing is selected
const data = new Int16Array(1); // Enough data for a single 16-bit integer (instanceID)
const mousePosition = { x:240, y:240 };

const animate = () => {
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

	// CLEAR THE TEXTURES
	// Note: clear(COLOR_BUFFER_BIT) won't work if one of the textures is for integers

	// clearBufferfv() will clear the color buffer since it is filled with
	// floating point data (even though, yes, it's stored as a Uint8ClampedArray)
	gl.clearBufferfv(gl.COLOR, 0, new Float32Array([ 0,0,0,0 ]));

	// clearBufferiv() will clear the integer texture. Note that even though
	// the integer texture is R16I, we still need to pass in 4 values.
	gl.clearBufferiv(gl.COLOR, 1, new Int16Array([ -1,-1,-1,-1 ]))

	geometryProgram.draw(selectedInstanceID);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	// Draw a texture (the color texture) on a quad
	quadProgram.draw();

	requestAnimationFrame(animate);
};

animate();

const fence = () => new Promise((resolve, reject) => {
	// This will create a fence. If this follows a `readPixels()` call, then it
	// will signal to WebGL that the read instruction should be asynchronous. 
	// This means JS can continue to work on other tasks while the read instruction
	// completes.
	const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
	gl.flush();

	// There are TWO possible ways to check on the status of a WebGLSync object.

	// 1. This will check it using clientWaitSync()
	const checkStatus_v1 = () => {
		const status = gl.clientWaitSync(sync, 0, 0);

		// There are four possible values for status:
		// a. ALREADY_SIGNALED and CONDITION_SATISFIED (done)
		// b. TIMEOUT_EXPIRED (check again later)
		// c. WAIT_FAILED (there was an error)
		if (status === gl.TIMEOUT_EXPIRED) {
			setTimeout(checkStatus_v1);
		} else if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
			gl.deleteSync(sync);
			resolve();
		} else {
			gl.deleteSync(sync);
			reject(new Error('Fence did not resolve normally for some reason'));
		}
	};

	// 2. This will check with getSyncParameter(s, gl.SYNC_STATUS)
	const checkStatus_v2 = () => {
		const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);

		// There are only two possible values for status: SIGNALED and UNSIGNALED
		// Note that there is no `error` signal, so there is no reason to use `reject()` here
		if (status === gl.SIGNALED) {
			gl.deleteSync(sync);
			resolve();
		} else {
			setTimeout(checkStatus_v2);
		}
	};

	setTimeout(checkStatus_v2);
});

const updateData = () => {
	// This will transfer the pixel data from the pbo to the typed array.
	// Note: if you run this without using a fence or before the fence
	// has completed, you will stall the graphics pipeline and trigger a
	// warning.
	gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
	gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
	gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

	selectedInstanceID = data[0];
};

canvas.addEventListener('mousedown', (evt) => {
	// We can use the mouse offsetX value directly
	mousePosition.x = evt.offsetX;

	// But we need to flip offsetY, since we need it relative to the bottom of the texture
	mousePosition.y = canvas.height - evt.offsetY;
	
	gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.readBuffer(gl.COLOR_ATTACHMENT1);// This is the attachment we want to read
	gl.readPixels(						// This will read the pixels to the buffer asynchronously
		mousePosition.x,mousePosition.y,1,1,
		gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
		gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
		0
	);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

	// Two step process:
	// 1. fence() will wait until we know for sure the read operation is complete
	// 2. updateData() will transfer the pixel data from the pbo to the typed array
	fence().then(updateData);
});