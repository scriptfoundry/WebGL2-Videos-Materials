import { mat4, vec3 } from 'gl-matrix';

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

// returns WebGL program and a draw() function for the GEOMETRY
const createGeometryProgram = () => {
	const vertexShaderSource = `#version 300 es
		#pragma vscode_glsllint_stage: vert

		uniform mat4 uModel;
		uniform mat4 uView;
		uniform mat4 uProjection;

		layout(location=0) in vec4 aPosition;
		layout(location=1) in vec3 aNormal;
		layout(location=2) in vec4 aOffset;

		out vec3 vLocalPosition;
		out vec3 vNormal;

		void main()
		{
			vec4 localPosition = uModel * (aPosition + aOffset.xzyw);

			gl_Position = uProjection * uView * localPosition;

			vLocalPosition = localPosition.xyz;
			vNormal = aNormal;
		}
	`;

	const fragmentShaderSource = `#version 300 es
		#pragma vscode_glsllint_stage: frag
		precision mediump float;

		in vec3 vLocalPosition;
		in vec3 vNormal;

		layout(location=0) out vec3 fboPosition;
		layout(location=1) out vec3 fboNormal;

		void main()
		{
			fboPosition = vLocalPosition;
			fboNormal = vNormal;
		}
	`;

	const icosphere = new Float32Array([
		// position (vec3)   normal (vec3)
		 0.000,-1.000, 0.000, 0.102,-0.944, 0.315,
		 0.425,-0.851, 0.309, 0.102,-0.944, 0.315,
		-0.162,-0.851, 0.500, 0.102,-0.944, 0.315,
		 0.724,-0.447, 0.526, 0.700,-0.662, 0.268,
		 0.425,-0.851, 0.309, 0.700,-0.662, 0.268,
		 0.851,-0.526, 0.000, 0.700,-0.662, 0.268,
		 0.000,-1.000, 0.000,-0.268,-0.944, 0.195,
		-0.162,-0.851, 0.500,-0.268,-0.944, 0.195,
		-0.526,-0.851, 0.000,-0.268,-0.944, 0.195,
		 0.000,-1.000, 0.000,-0.268,-0.944,-0.195,
		-0.526,-0.851, 0.000,-0.268,-0.944,-0.195,
		-0.162,-0.851,-0.500,-0.268,-0.944,-0.195,
		 0.000,-1.000, 0.000, 0.102,-0.944,-0.315,
		-0.162,-0.851,-0.500, 0.102,-0.944,-0.315,
		 0.425,-0.851,-0.309, 0.102,-0.944,-0.315,
		 0.724,-0.447, 0.526, 0.905,-0.330, 0.268,
		 0.851,-0.526, 0.000, 0.905,-0.330, 0.268,
		 0.951, 0.000, 0.309, 0.905,-0.330, 0.268,
		-0.276,-0.447, 0.851, 0.025,-0.330, 0.944,
		 0.263,-0.526, 0.809, 0.025,-0.330, 0.944,
		 0.000, 0.000, 1.000, 0.025,-0.330, 0.944,
		-0.894,-0.447, 0.000,-0.890,-0.330, 0.315,
		-0.688,-0.526, 0.500,-0.890,-0.330, 0.315,
		-0.951, 0.000, 0.309,-0.890,-0.330, 0.315,
		-0.276,-0.447,-0.851,-0.575,-0.330,-0.749,
		-0.688,-0.526,-0.500,-0.575,-0.330,-0.749,
		-0.588, 0.000,-0.809,-0.575,-0.330,-0.749,
		 0.724,-0.447,-0.526, 0.535,-0.330,-0.778,
		 0.263,-0.526,-0.809, 0.535,-0.330,-0.778,
		 0.588, 0.000,-0.809, 0.535,-0.330,-0.778,
		 0.724,-0.447, 0.526, 0.803,-0.126, 0.583,
		 0.951, 0.000, 0.309, 0.803,-0.126, 0.583,
		 0.588, 0.000, 0.809, 0.803,-0.126, 0.583,
		-0.276,-0.447, 0.851,-0.307,-0.126, 0.944,
		 0.000, 0.000, 1.000,-0.307,-0.126, 0.944,
		-0.588, 0.000, 0.809,-0.307,-0.126, 0.944,
		-0.894,-0.447, 0.000,-0.992,-0.126, 0.000,
		-0.951, 0.000, 0.309,-0.992,-0.126, 0.000,
		-0.951, 0.000,-0.309,-0.992,-0.126, 0.000,
		-0.276,-0.447,-0.851,-0.307,-0.126,-0.944,
		-0.588, 0.000,-0.809,-0.307,-0.126,-0.944,
		 0.000, 0.000,-1.000,-0.307,-0.126,-0.944,
		 0.724,-0.447,-0.526, 0.803,-0.126,-0.583,
		 0.588, 0.000,-0.809, 0.803,-0.126,-0.583,
		 0.951, 0.000,-0.309, 0.803,-0.126,-0.583,
		 0.276, 0.447, 0.851, 0.409, 0.662, 0.628,
		 0.688, 0.526, 0.500, 0.409, 0.662, 0.628,
		 0.162, 0.851, 0.500, 0.409, 0.662, 0.628,
		-0.724, 0.447, 0.526,-0.471, 0.662, 0.583,
		-0.263, 0.526, 0.809,-0.471, 0.662, 0.583,
		-0.425, 0.851, 0.309,-0.471, 0.662, 0.583,
		-0.724, 0.447,-0.526,-0.700, 0.662,-0.268,
		-0.851, 0.526, 0.000,-0.700, 0.662,-0.268,
		-0.425, 0.851,-0.309,-0.700, 0.662,-0.268,
		 0.276, 0.447,-0.851, 0.038, 0.662,-0.749,
		-0.263, 0.526,-0.809, 0.038, 0.662,-0.749,
		 0.162, 0.851,-0.500, 0.038, 0.662,-0.749,
		 0.894, 0.447, 0.000, 0.724, 0.662,-0.195,
		 0.688, 0.526,-0.500, 0.724, 0.662,-0.195,
		 0.526, 0.851, 0.000, 0.724, 0.662,-0.195,
		 0.526, 0.851, 0.000, 0.268, 0.944,-0.195,
		 0.162, 0.851,-0.500, 0.268, 0.944,-0.195,
		 0.000, 1.000, 0.000, 0.268, 0.944,-0.195,
		 0.526, 0.851, 0.000, 0.491, 0.795,-0.357,
		 0.688, 0.526,-0.500, 0.491, 0.795,-0.357,
		 0.162, 0.851,-0.500, 0.491, 0.795,-0.357,
		 0.688, 0.526,-0.500, 0.409, 0.662,-0.628,
		 0.276, 0.447,-0.851, 0.409, 0.662,-0.628,
		 0.162, 0.851,-0.500, 0.409, 0.662,-0.628,
		 0.162, 0.851,-0.500,-0.102, 0.944,-0.315,
		-0.425, 0.851,-0.309,-0.102, 0.944,-0.315,
		 0.000, 1.000, 0.000,-0.102, 0.944,-0.315,
		 0.162, 0.851,-0.500,-0.188, 0.795,-0.577,
		-0.263, 0.526,-0.809,-0.188, 0.795,-0.577,
		-0.425, 0.851,-0.309,-0.188, 0.795,-0.577,
		-0.263, 0.526,-0.809,-0.471, 0.662,-0.583,
		-0.724, 0.447,-0.526,-0.471, 0.662,-0.583,
		-0.425, 0.851,-0.309,-0.471, 0.662,-0.583,
		-0.425, 0.851,-0.309,-0.331, 0.944, 0.000,
		-0.425, 0.851, 0.309,-0.331, 0.944, 0.000,
		 0.000, 1.000, 0.000,-0.331, 0.944, 0.000,
		-0.425, 0.851,-0.309,-0.607, 0.795, 0.000,
		-0.851, 0.526, 0.000,-0.607, 0.795, 0.000,
		-0.425, 0.851, 0.309,-0.607, 0.795, 0.000,
		-0.851, 0.526, 0.000,-0.700, 0.662, 0.268,
		-0.724, 0.447, 0.526,-0.700, 0.662, 0.268,
		-0.425, 0.851, 0.309,-0.700, 0.662, 0.268,
		-0.425, 0.851, 0.309,-0.102, 0.944, 0.315,
		 0.162, 0.851, 0.500,-0.102, 0.944, 0.315,
		 0.000, 1.000, 0.000,-0.102, 0.944, 0.315,
		-0.425, 0.851, 0.309,-0.188, 0.795, 0.577,
		-0.263, 0.526, 0.809,-0.188, 0.795, 0.577,
		 0.162, 0.851, 0.500,-0.188, 0.795, 0.577,
		-0.263, 0.526, 0.809, 0.038, 0.662, 0.749,
		 0.276, 0.447, 0.851, 0.038, 0.662, 0.749,
		 0.162, 0.851, 0.500, 0.038, 0.662, 0.749,
		 0.162, 0.851, 0.500, 0.268, 0.944, 0.195,
		 0.526, 0.851, 0.000, 0.268, 0.944, 0.195,
		 0.000, 1.000, 0.000, 0.268, 0.944, 0.195,
		 0.162, 0.851, 0.500, 0.491, 0.795, 0.357,
		 0.688, 0.526, 0.500, 0.491, 0.795, 0.357,
		 0.526, 0.851, 0.000, 0.491, 0.795, 0.357,
		 0.688, 0.526, 0.500, 0.724, 0.662, 0.195,
		 0.894, 0.447, 0.000, 0.724, 0.662, 0.195,
		 0.526, 0.851, 0.000, 0.724, 0.662, 0.195,
		 0.951, 0.000,-0.309, 0.890, 0.330,-0.315,
		 0.688, 0.526,-0.500, 0.890, 0.330,-0.315,
		 0.894, 0.447, 0.000, 0.890, 0.330,-0.315,
		 0.951, 0.000,-0.309, 0.795, 0.188,-0.577,
		 0.588, 0.000,-0.809, 0.795, 0.188,-0.577,
		 0.688, 0.526,-0.500, 0.795, 0.188,-0.577,
		 0.588, 0.000,-0.809, 0.575, 0.330,-0.749,
		 0.276, 0.447,-0.851, 0.575, 0.330,-0.749,
		 0.688, 0.526,-0.500, 0.575, 0.330,-0.749,
		 0.000, 0.000,-1.000,-0.025, 0.330,-0.944,
		-0.263, 0.526,-0.809,-0.025, 0.330,-0.944,
		 0.276, 0.447,-0.851,-0.025, 0.330,-0.944,
		 0.000, 0.000,-1.000,-0.303, 0.188,-0.934,
		-0.588, 0.000,-0.809,-0.303, 0.188,-0.934,
		-0.263, 0.526,-0.809,-0.303, 0.188,-0.934,
		-0.588, 0.000,-0.809,-0.535, 0.330,-0.778,
		-0.724, 0.447,-0.526,-0.535, 0.330,-0.778,
		-0.263, 0.526,-0.809,-0.535, 0.330,-0.778,
		-0.951, 0.000,-0.309,-0.905, 0.330,-0.268,
		-0.851, 0.526, 0.000,-0.905, 0.330,-0.268,
		-0.724, 0.447,-0.526,-0.905, 0.330,-0.268,
		-0.951, 0.000,-0.309,-0.982, 0.188, 0.000,
		-0.951, 0.000, 0.309,-0.982, 0.188, 0.000,
		-0.851, 0.526, 0.000,-0.982, 0.188, 0.000,
		-0.951, 0.000, 0.309,-0.905, 0.330, 0.268,
		-0.724, 0.447, 0.526,-0.905, 0.330, 0.268,
		-0.851, 0.526, 0.000,-0.905, 0.330, 0.268,
		-0.588, 0.000, 0.809,-0.535, 0.330, 0.778,
		-0.263, 0.526, 0.809,-0.535, 0.330, 0.778,
		-0.724, 0.447, 0.526,-0.535, 0.330, 0.778,
		-0.588, 0.000, 0.809,-0.303, 0.188, 0.934,
		 0.000, 0.000, 1.000,-0.303, 0.188, 0.934,
		-0.263, 0.526, 0.809,-0.303, 0.188, 0.934,
		 0.000, 0.000, 1.000,-0.025, 0.330, 0.944,
		 0.276, 0.447, 0.851,-0.025, 0.330, 0.944,
		-0.263, 0.526, 0.809,-0.025, 0.330, 0.944,
		 0.588, 0.000, 0.809, 0.575, 0.330, 0.749,
		 0.688, 0.526, 0.500, 0.575, 0.330, 0.749,
		 0.276, 0.447, 0.851, 0.575, 0.330, 0.749,
		 0.588, 0.000, 0.809, 0.795, 0.188, 0.577,
		 0.951, 0.000, 0.309, 0.795, 0.188, 0.577,
		 0.688, 0.526, 0.500, 0.795, 0.188, 0.577,
		 0.951, 0.000, 0.309, 0.890, 0.330, 0.315,
		 0.894, 0.447, 0.000, 0.890, 0.330, 0.315,
		 0.688, 0.526, 0.500, 0.890, 0.330, 0.315,
		 0.588, 0.000,-0.809, 0.307, 0.126,-0.944,
		 0.000, 0.000,-1.000, 0.307, 0.126,-0.944,
		 0.276, 0.447,-0.851, 0.307, 0.126,-0.944,
		 0.588, 0.000,-0.809, 0.303,-0.188,-0.934,
		 0.263,-0.526,-0.809, 0.303,-0.188,-0.934,
		 0.000, 0.000,-1.000, 0.303,-0.188,-0.934,
		 0.263,-0.526,-0.809, 0.025,-0.330,-0.944,
		-0.276,-0.447,-0.851, 0.025,-0.330,-0.944,
		 0.000, 0.000,-1.000, 0.025,-0.330,-0.944,
		-0.588, 0.000,-0.809,-0.803, 0.126,-0.583,
		-0.951, 0.000,-0.309,-0.803, 0.126,-0.583,
		-0.724, 0.447,-0.526,-0.803, 0.126,-0.583,
		-0.588, 0.000,-0.809,-0.795,-0.188,-0.577,
		-0.688,-0.526,-0.500,-0.795,-0.188,-0.577,
		-0.951, 0.000,-0.309,-0.795,-0.188,-0.577,
		-0.688,-0.526,-0.500,-0.890,-0.330,-0.315,
		-0.894,-0.447, 0.000,-0.890,-0.330,-0.315,
		-0.951, 0.000,-0.309,-0.890,-0.330,-0.315,
		-0.951, 0.000, 0.309,-0.803, 0.126, 0.583,
		-0.588, 0.000, 0.809,-0.803, 0.126, 0.583,
		-0.724, 0.447, 0.526,-0.803, 0.126, 0.583,
		-0.951, 0.000, 0.309,-0.795,-0.188, 0.577,
		-0.688,-0.526, 0.500,-0.795,-0.188, 0.577,
		-0.588, 0.000, 0.809,-0.795,-0.188, 0.577,
		-0.688,-0.526, 0.500,-0.575,-0.330, 0.749,
		-0.276,-0.447, 0.851,-0.575,-0.330, 0.749,
		-0.588, 0.000, 0.809,-0.575,-0.330, 0.749,
		 0.000, 0.000, 1.000, 0.307, 0.126, 0.944,
		 0.588, 0.000, 0.809, 0.307, 0.126, 0.944,
		 0.276, 0.447, 0.851, 0.307, 0.126, 0.944,
		 0.000, 0.000, 1.000, 0.303,-0.188, 0.934,
		 0.263,-0.526, 0.809, 0.303,-0.188, 0.934,
		 0.588, 0.000, 0.809, 0.303,-0.188, 0.934,
		 0.263,-0.526, 0.809, 0.535,-0.330, 0.778,
		 0.724,-0.447, 0.526, 0.535,-0.330, 0.778,
		 0.588, 0.000, 0.809, 0.535,-0.330, 0.778,
		 0.951, 0.000, 0.309, 0.992, 0.126, 0.000,
		 0.951, 0.000,-0.309, 0.992, 0.126, 0.000,
		 0.894, 0.447, 0.000, 0.992, 0.126, 0.000,
		 0.951, 0.000, 0.309, 0.982,-0.188, 0.000,
		 0.851,-0.526, 0.000, 0.982,-0.188, 0.000,
		 0.951, 0.000,-0.309, 0.982,-0.188, 0.000,
		 0.851,-0.526, 0.000, 0.905,-0.330,-0.268,
		 0.724,-0.447,-0.526, 0.905,-0.330,-0.268,
		 0.951, 0.000,-0.309, 0.905,-0.330,-0.268,
		 0.425,-0.851,-0.309, 0.471,-0.662,-0.583,
		 0.263,-0.526,-0.809, 0.471,-0.662,-0.583,
		 0.724,-0.447,-0.526, 0.471,-0.662,-0.583,
		 0.425,-0.851,-0.309, 0.188,-0.795,-0.577,
		-0.162,-0.851,-0.500, 0.188,-0.795,-0.577,
		 0.263,-0.526,-0.809, 0.188,-0.795,-0.577,
		-0.162,-0.851,-0.500,-0.038,-0.662,-0.749,
		-0.276,-0.447,-0.851,-0.038,-0.662,-0.749,
		 0.263,-0.526,-0.809,-0.038,-0.662,-0.749,
		-0.162,-0.851,-0.500,-0.409,-0.662,-0.628,
		-0.688,-0.526,-0.500,-0.409,-0.662,-0.628,
		-0.276,-0.447,-0.851,-0.409,-0.662,-0.628,
		-0.162,-0.851,-0.500,-0.491,-0.795,-0.357,
		-0.526,-0.851, 0.000,-0.491,-0.795,-0.357,
		-0.688,-0.526,-0.500,-0.491,-0.795,-0.357,
		-0.526,-0.851, 0.000,-0.724,-0.662,-0.195,
		-0.894,-0.447, 0.000,-0.724,-0.662,-0.195,
		-0.688,-0.526,-0.500,-0.724,-0.662,-0.195,
		-0.526,-0.851, 0.000,-0.724,-0.662, 0.195,
		-0.688,-0.526, 0.500,-0.724,-0.662, 0.195,
		-0.894,-0.447, 0.000,-0.724,-0.662, 0.195,
		-0.526,-0.851, 0.000,-0.491,-0.795, 0.357,
		-0.162,-0.851, 0.500,-0.491,-0.795, 0.357,
		-0.688,-0.526, 0.500,-0.491,-0.795, 0.357,
		-0.162,-0.851, 0.500,-0.409,-0.662, 0.628,
		-0.276,-0.447, 0.851,-0.409,-0.662, 0.628,
		-0.688,-0.526, 0.500,-0.409,-0.662, 0.628,
		 0.851,-0.526, 0.000, 0.700,-0.662,-0.268,
		 0.425,-0.851,-0.309, 0.700,-0.662,-0.268,
		 0.724,-0.447,-0.526, 0.700,-0.662,-0.268,
		 0.851,-0.526, 0.000, 0.607,-0.795, 0.000,
		 0.425,-0.851, 0.309, 0.607,-0.795, 0.000,
		 0.425,-0.851,-0.309, 0.607,-0.795, 0.000,
		 0.425,-0.851, 0.309, 0.331,-0.944, 0.000,
		 0.000,-1.000, 0.000, 0.331,-0.944, 0.000,
		 0.425,-0.851,-0.309, 0.331,-0.944, 0.000,
		-0.162,-0.851, 0.500,-0.038,-0.662, 0.749,
		 0.263,-0.526, 0.809,-0.038,-0.662, 0.749,
		-0.276,-0.447, 0.851,-0.038,-0.662, 0.749,
		-0.162,-0.851, 0.500, 0.188,-0.795, 0.577,
		 0.425,-0.851, 0.309, 0.188,-0.795, 0.577,
		 0.263,-0.526, 0.809, 0.188,-0.795, 0.577,
		 0.425,-0.851, 0.309, 0.471,-0.662, 0.583,
		 0.724,-0.447, 0.526, 0.471,-0.662, 0.583,
		 0.263,-0.526, 0.809, 0.471,-0.662, 0.583,
	]);

	const vertexCount = icosphere.length / 6;

	const instanceCount = 400;
	const offsets = new Float32Array(instanceCount * 2);
	for (let i = 0; i < instanceCount; i += 1) {
		const index = i * 2;
		const row = (i % 20) - 10;
		const col = Math.floor(i / 20 - 10);
		offsets[index]   = 2 * row;
		offsets[index+1] = 2 * col;
	}

	const program = createWebGLProgram(gl, vertexShaderSource, fragmentShaderSource);
	gl.enable(gl.CULL_FACE);

	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, icosphere, gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
	gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);

	const offsetsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, offsetsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);
	gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
	gl.vertexAttribDivisor(2, 1);
	gl.enableVertexAttribArray(2);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.bindVertexArray(null);

	const draw = () => {
		gl.useProgram(program);
		gl.bindVertexArray(vao);

		gl.enable(gl.DEPTH_TEST);
		gl.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, instanceCount);
		gl.disable(gl.DEPTH_TEST);
	}

	return { program, draw };
};

// returns WebGL program and a draw() function for the QUAD
const createQuadProgram = () => {
	const vertexShaderSource =
		`#version 300 es
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

	const fragmentShaderSource =
		`#version 300 es
		#pragma vscode_glsllint_stage: frag

		precision mediump float;

		uniform vec3 uDirectionalLight;
		uniform vec3[4] uPointLights;

		uniform sampler2D positionSampler;
		uniform sampler2D normalSampler;

		in vec2 vTexCoord;

		out vec4 fragColor;

		void main()
		{
			vec4 baseColor = vec4(.2, .4, .8, 1.0);
			vec4 lightColor = vec4(1.4, .4, 1.0, 1.0);
			vec3 normal = normalize(texture(normalSampler, vTexCoord).rgb);
			vec3 position = texture(positionSampler, vTexCoord).rgb;

			float diffuseBrightness = 0.4 * max(0.0, dot(uDirectionalLight, normal));
			float spotBrightness = 0.0;

			for (int i = 0; i < 4; i++) {
				vec3 offset = uPointLights[i] - position;
				vec3 direction = normalize(offset);
				float distance = length(offset);
				float cos = max(0.0, dot(direction, normal));

				spotBrightness += 1.2 * cos / (distance * distance);
			}

			fragColor = diffuseBrightness * baseColor
						+ spotBrightness  * lightColor;
			fragColor.a = 1.0;
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
		gl.bindVertexArray(null);
	};

	return { program, draw };
};

// MVP matrices are required by the geometry program
const initializeMVPMatrices = () => {
	gl.useProgram(geometry.program);

	const uModel = mat4.create();
	const uModelLocation = gl.getUniformLocation(geometry.program, 'uModel');
	mat4.scale(uModel, uModel, new Float32Array([.2, .2, .2]));
	gl.uniformMatrix4fv(uModelLocation, false, uModel);

	const uView = mat4.create();
	const uViewLocation = gl.getUniformLocation(geometry.program, 'uView');
	mat4.lookAt(uView, new Float32Array([1.5,.3,1.8]), new Float32Array([ 0, -1, 0 ]), new Float32Array([ 0, 1, 0 ]));
	gl.uniformMatrix4fv(uViewLocation, false, uView);

	const uProjection = mat4.create();
	const uProjectionLocation = gl.getUniformLocation(geometry.program, 'uProjection');
	mat4.perspective(uProjection, 1, 1, .1, 20);
	gl.uniformMatrix4fv(uProjectionLocation, false, uProjection);

	gl.useProgram(null);
};

// returns an update() function for the light uniforms
// (used by the fragment shader that makes the lighting calculations)
const createLights = (program) => {
	// Static directional Light
	gl.useProgram(program);
	gl.uniform3f(gl.getUniformLocation(program, 'uDirectionalLight'), -1, 1, 1);
	gl.useProgram(null);

	// Dynamic point lights
	const lightData = new Float32Array([
		 1.3, 1.5, -2.6,
		-2.6, 1.5,  1.3,
		 2.6, 1.5, -2.6,
		 1.3, 1.5,  1.8,
	]);
	const lights = [
		new Float32Array(lightData.buffer, 0, 3),
		new Float32Array(lightData.buffer, 12, 3),
		new Float32Array(lightData.buffer, 24, 3),
		new Float32Array(lightData.buffer, 36, 3),
	];

	const uPointLights = gl.getUniformLocation(program, 'uPointLights');

	const update = () => {
		gl.useProgram(program);

		for (let i = 0; i < 4; i++) {
			vec3.rotateY(lights[i], lights[i], vec3.fromValues(0,1,0), 0.025 + (i * .005));
		}

		gl.uniform3fv(uPointLights, lightData);
	};

	return { update };
};

const createFramebufferObject = (program) => {
	const normalTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, normalTexture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, 480,480);

	const positionTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, positionTexture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, 480,480);

	const depthRenderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 480,480);

	const fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTexture, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

	gl.drawBuffers([ gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1 ]);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.useProgram(program);
	gl.uniform1i(gl.getUniformLocation(program, 'positionSampler'), 0);
	gl.uniform1i(gl.getUniformLocation(program, 'normalSampler'), 1);
	gl.useProgram(null);

	return fbo;
};

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
gl.getExtension("EXT_color_buffer_float");

const geometry = createGeometryProgram();
const quad = createQuadProgram();


// MVP matrix uniforms are used by the geometry program to orient the camera
initializeMVPMatrices();


// Lights are fragment shader uniforms used for the lighting calculations
const lights = createLights(quad.program);

const fbo = createFramebufferObject(quad.program);

const animate = () => {
	lights.update();

	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	geometry.draw();
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	quad.draw();

	requestAnimationFrame(animate);
};

animate();