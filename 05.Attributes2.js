const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in float aPointSize;
layout(location=2) in vec4 aColor;

out vec4 vColor;

void main()
{
	vColor = aColor;
	gl_PointSize = aPointSize;
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

const gl = document.querySelector('canvas').getContext('webgl2');

const program = gl.createProgram();
// This code compiles the shaders and links the program.
{
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSrc);
	gl.compileShader(vertexShader);
	gl.attachShader(program, vertexShader);

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSrc);
	gl.compileShader(fragmentShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.log(gl.getShaderInfoLog(vertexShader));
		console.log(gl.getShaderInfoLog(fragmentShader));
	}
}
gl.useProgram(program);

const vertData = new Float32Array([
	-0.6618,-0.7687, 	50, 	0.5849, 0.7600, 0.4662,
	-0.3149, 0.7417, 	10, 	0.9232, 0.9332, 0.4260,
	 0.9749,-0.8996, 	40, 	0.6969, 0.5353, 0.1471,
	-0.9202,-0.2956, 	90, 	0.2899, 0.9056, 0.7799,
	 0.4550,-0.0642, 	20, 	0.2565, 0.6451, 0.8498,
	 0.6192, 0.5755, 	70, 	0.6133, 0.8137, 0.4046,
	-0.5946, 0.7057, 	20, 	0.6745, 0.5229, 0.4518,
	 0.6365, 0.7236, 	70, 	0.4690, 0.0542, 0.7396,
	 0.8625,-0.0835, 	20, 	0.3708, 0.6588, 0.8611,
	 0.7997, 0.4695, 	70, 	0.7490, 0.3797, 0.6879,
]);

const vertData2 = new Int16Array([
	-21686,-25189,		50,		 19166, 24903, 15276,
	-10319, 24304,		10,		 30251, 30579, 13959,
	 31945,-29479,		40,		 22836, 17540,  4820,
	-30154, -9687,		90,		  9499, 29674, 25555,
	 14909, -2104,		20,		  8404, 21138, 27846,
	 20289, 18857,		70,		 20096, 26663, 13257,
	-19484, 23124,		20,		 22102, 17134, 14804,
	 20856, 23710,		70,		 15368,  1776, 24235,
	 28262, -2737,		20,		 12150, 21587, 28216,
	 26204, 15384,		70,		 24543, 12442, 22541,
]);

const vertData3 = new Int8Array([
	 -85, -99,   		50,		  74,  97,  59,
	 -41,  94,   		10,		 118, 119,  54,
	 124,-116,   		40,		  89,  68,  18,
	-118, -38,   		90,		  37, 115,  99,
	  58,  -9,   		20,		  32,  82, 108,
	  79,  73,   		70,		  78, 104,  51,
	 -77,  90,   		20,		  86,  66,  57,
	  81,  92,   		70,		  60,   6,  94,
	 110, -11,   		20,		  47,  84, 110,
	 102,  60,   		70,		  95,  48,  88,
]);

const aPositionLoc = 0;
const aPointSizeLoc = 1;
const aColorLoc = 2;

gl.vertexAttrib4f(aPositionLoc, 0, 0, 0, 1);
gl.vertexAttrib1f(aPointSizeLoc, 50);
gl.vertexAttrib4f(aColorLoc, 1, 0, 0, 1);

const vertBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.STATIC_DRAW);

gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(aPointSizeLoc, 1, gl.FLOAT, false, 24, 8);
gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 24, 12);

gl.enableVertexAttribArray(aPositionLoc);
gl.enableVertexAttribArray(aColorLoc);
gl.enableVertexAttribArray(aPointSizeLoc);

gl.drawArrays(gl.POINTS, 0, 10);
