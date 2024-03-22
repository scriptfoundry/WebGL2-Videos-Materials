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

		out vec4 fragColor;

		void main()
		{
			if (uSelectedInstanceID == vInstanceID) {
				fragColor = vec4(1,0,0,1);
			} else {
				fragColor = vColor;
			}
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
		// gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
		gl.bindVertexArray(null);
	};

	return { draw };
};

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const geometryProgram = createGeometryProgram();
const quadProgram = createQuadProgram();

// Change this to change the selected object
let selectedInstanceID = 54;

const animate = () => {
	geometryProgram.draw(selectedInstanceID);
	
	quadProgram.draw();

	requestAnimationFrame(animate);
};

animate();