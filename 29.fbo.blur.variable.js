// Create kernel size slider and inject into the HTML page
const createSlider = (notifier, defaultValue=1, minValue=1, maxValue=255) => {
	const slider = document.createElement('input');
	slider.type="range";
	slider.max=maxValue.toString();
	slider.min=minValue.toString();
	slider.step="2";
	slider.defaultValue= defaultValue.toString();

	const eventHandler = () => notifier(slider.value);
	slider.addEventListener('mousemove', eventHandler);
	slider.addEventListener('touchmove', eventHandler);

	document.body.appendChild(slider);

	notifier(defaultValue);
};

// Create FPS readout and inject into the HTML page
const createFPS = () => {
	const LOG_SIZE = 60;
	const times = new Uint32Array(LOG_SIZE);
	times.fill(1000);
	let timesIndex = 0;
	let previousTime;

	const meter = document.createElement('div');
	document.body.append(meter);

	const timer = (time) => {
		if (previousTime) {
			times[timesIndex] = 1000 / (time - previousTime);
			const minimum = times.reduce((c,v)=>Math.min(c,v),1000);
			timesIndex = (timesIndex + 1) % times.length;
			meter.innerText = `${kernelWidth}x${kernelWidth} (low: ${minimum.toPrecision(3)} fps in last ${ LOG_SIZE } frames)`;
		}
		previousTime = time;
		requestAnimationFrame(timer);
	};
	requestAnimationFrame(timer);
};

// Generate a gaussian kernel based on a width
const generate1DKernel = (width) => {
	if ((width & 1) !== 1) throw new Error('Only odd guassian kernel sizes are accepted');

	// Small sigma gaussian kernels are a problem. You usually need to add an error correction
	// algorithm. But since our kernels grow in discrete intervals, we can just pre-compute the
	// problematic ones. These values are derived from the Pascal's Triangle algorithm.
	const smallKernelLerps = [
        [1.0],
        [0.25, 0.5, 0.25],
        [0.0625, 0.25, 0.375, 0.25, 0.0625],
        [0.03125, 0.109375, 0.21875, 0.28125, 0.21875, 0.109375, 0.03125],
	];
	if (width < 9) return smallKernelLerps[(width - 1) >> 1];

	const kernel = [];
	const sigma = width / 6;     // Adjust as required
	const radius = (width - 1) / 2;

	let sum = 0;

	// Populate the array with gaussian kernel values
	for (let i = 0; i < width; i++) {
		const offset = i - radius;

		const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
		const exponent = -(offset * offset) / (2 * (sigma * sigma));
		const value = coefficient * Math.exp(exponent);

		// We'll need this for normalization below
		sum += value;

		kernel.push(value);
	}

	// Normalize the array
	for (let i = 0; i < width; i++) {
		kernel[i] /= sum;
	}

	return kernel;
};

// Convert a 1D gaussian kernel to value pairs, as an array of linearly interpolated
// UV coordinates and scaling factors. Gaussian kernels are always have an odd number of
// weights, so in this implementation, the first weight value is treated as the lone non-pair
// and then all remaining values are treated as pairs.
const convertKernelToOffsetsAndScales = (kernel) => {
	if ((kernel.length & 1) === 0) throw new Error('Only odd kernel sizes can be lerped');

	const radius = Math.ceil(kernel.length / 2);
	const data = [];

	// Prepopulate the array with the first cell as the lone weight value
	let offset = -radius + 1;
	let scale = kernel[0];
	data.push(offset, scale);

	const total = kernel.reduce((c,v) => c+v);

	for (let i = 1; i < kernel.length; i+= 2) {
		const a = kernel[i];
		const b = kernel[i + 1];

		offset = -radius + 1 + i + (b / (a + b));
		scale = (a + b) / total;
		data.push(offset, scale);
	}

	return data
};


// PART 1: INITIALIZATION

// Step 1: Prepare the environment

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

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

	layout(location=0) in vec4 aPosition;
	layout(location=1) in vec4 aColor;

	out vec4 vColor;

	void main()
	{
		vColor = aColor;
		gl_Position = aPosition;
	}`;

const triangleFragmentShaderSource =
	`#version 300 es
	#pragma vscode_glsllint_stage: frag

	precision mediump float;

	in vec4 vColor;

	out vec4 fragColor;

	void main()
	{
		fragColor = vColor;
	}`;

const triangleProgram = createProgram(gl, triangleVerexShaderSource, triangleFragmentShaderSource);

const triangleData = new Float32Array([
    // Pos (xyz)          // Color (rgb)
    -.50,-.50,            0,0,1,
    0.50,-.50,            0,0,1,
    0.00,0.40,            0,0,1,

    -.50,0.50,            1,0,0,
    0.50,0.50,            1,0,0,
    0.00,-.40,            1,0,0,

    -.70,-.70,            1,1,1,
    -.90,-.70,            1,1,1,
    -.90,-.90,            1,1,1,
    -.70,-.70,            1,1,1,
    -.90,-.90,            1,1,1,
    -.70,-.90,            1,1,1,

    -.70,0.85,            0,1,1,
    -.90,0.85,            0,1,1,
    -.90,0.98,            0,1,1,
    -.70,0.85,            0,1,1,
    -.90,0.98,            0,1,1,
    -.70,0.98,            0,1,1,

    0.85,-.70,            1,1,0,
    0.98,-.70,            1,1,0,
    0.98,-.90,            1,1,0,
    0.85,-.70,            1,1,0,
    0.98,-.90,            1,1,0,
    0.85,-.90,            1,1,0,

    0.90,0.90,            1,1,1,
    0.87,0.90,            1,1,1,
    0.87,0.87,            1,1,1,
    0.90,0.90,            1,1,1,
    0.87,0.87,            1,1,1,
    0.90,0.87,            1,1,1,
]);

// Two programs? Use vertex array objects. They will
// allow you to easily and instantly bind the buffers
// you need before you issue your draw calls.
const triangleVAO = gl.createVertexArray();
gl.bindVertexArray(triangleVAO);

const triangleBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleData, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

gl.bindVertexArray(null);


const blurVertexShaderSource =
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


const blurFragmentShaderSource =
`#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform sampler2D sampler;
uniform vec2 uvStride;
uniform vec2[128] offsetAndScale; // x=offset, y=scale
uniform int kernelWidth;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
	for (int i = 0; i < kernelWidth; i++) {
		fragColor += texture(
			sampler,
			vTexCoord + offsetAndScale[i].x * uvStride
		    //   ^------------------------------------  UV coord for this fragment
		    //              ^-------------------------  Offset to sample (in texel space)
		    //                                  ^-----  Amount to move in UV space per texel (horizontal OR vertical only)
		    //   v------------------------------------  Scale down the sample
		) * offsetAndScale[i].y;
	}
}`;

const drawTriangles = () => {
	gl.useProgram(triangleProgram);
	gl.bindVertexArray(triangleVAO);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 30);
	gl.bindVertexArray(null);
};

// Step 3: Create the blur program for drawing to the intermediate caching texture
// and to the canvas
const blurProgram = createProgram(gl, blurVertexShaderSource, blurFragmentShaderSource);

const blurQuadData = new Float32Array([
    // Pos (xy)         // UV coordinate
    -1, 1,              0,1,
    -1,-1,              0,0,
     1, 1,              1,1,
     1,-1,              1,0,
]);

const blurVAO = gl.createVertexArray();
gl.bindVertexArray(blurVAO);

const blurBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, blurBuffer);
gl.bufferData(gl.ARRAY_BUFFER, blurQuadData, gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

gl.bindVertexArray(null);

// The geometry texture will be sampled during the HORIZONTAL pass
const geometryTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, geometryTexture);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 480, 480);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

const geometryFbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, geometryFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, geometryTexture, 0);

// The intermediate cache texture will be sampled during the VERTICAL pass
const intermediateTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, intermediateTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 480, 480);

const intermediateFbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, intermediateFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, intermediateTexture, 0);

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.bindTexture(gl.TEXTURE_2D, null);


const uvStrideUniformLocation = gl.getUniformLocation(blurProgram, 'uvStride');
const offsetScaleLocation = gl.getUniformLocation(blurProgram, 'offsetAndScale');
const kernelWidthLocation = gl.getUniformLocation(blurProgram, 'kernelWidth')

// Globals:
const offsetsAndScales = new Float32Array(256); // Supports gaussian blurs up to 255x255
let kernelWidth;

// setKernelWidth gets called any time the kernel size changes. It will:
// 1. calculate the kernel
// 2. populate `offsetsAndScales`
// 3. upload the new data to the vec2 array uniform
// 4. send the size of the vec2 array
const setKernelWidth = (newWidth) => {
	if (newWidth === kernelWidth) return;
	kernelWidth = newWidth;

	const kernel1D = generate1DKernel(newWidth);
	const lerpKernel = convertKernelToOffsetsAndScales(kernel1D);
	const numberOfOffsetsAndScales = lerpKernel.length / 2;

	offsetsAndScales.set(lerpKernel);

	gl.useProgram(blurProgram);
	gl.uniform2fv(offsetScaleLocation, offsetsAndScales);
	gl.uniform1i(kernelWidthLocation, numberOfOffsetsAndScales);
};


// This will apply the 1D gaussian blur either horizontally or vertically from
// an input texture, to an output FBO, along a direction set with a horizontal or vertical stride
//     1. sourceTexture: where the blur program will get its samples (a sampler2D)
//     2. destinationFBO: the framebuffer object you created to hold the output
//     3. unidirectionalUVStride: the 2D horizontal or vertical uv-space unit to move
//        per pixel (eg [0,.0625] or [.03125,0])
const drawUnidirectionalBlur = (sourceTexture, destinationFBO, unidirectionalUVStride) => {
	gl.useProgram(blurProgram);  // The program and vao shouldn't be global like this.
	gl.bindVertexArray(blurVAO); // This is only for clarity.

	gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
	gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFBO);

	gl.uniform2fv(uvStrideUniformLocation, unidirectionalUVStride);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindVertexArray(null);
	gl.useProgram(null);
};

const animate = () => {
	// The canvas is 480x480, so the stride is set by these values
	const WIDTH  = 1/480;
	const HEIGHT = 1/480;

	// Draw triangles to geometry texture
	gl.bindFramebuffer(gl.FRAMEBUFFER, geometryFbo);
	drawTriangles();

	// Horizontal pass samples from geometry texture and outputs to the cache FBO
	drawUnidirectionalBlur(geometryTexture, intermediateFbo, [WIDTH, 0]);

	// Vertical pass samples from the cache texture and outputs to the canvas (FBO = null)
	drawUnidirectionalBlur(intermediateTexture, null, [0, HEIGHT]);

	requestAnimationFrame(animate);
};

// Start the application:
createSlider((v) => setKernelWidth(v), 33, 1, 255);
createFPS();
animate();
