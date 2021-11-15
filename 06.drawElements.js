// tslint:disable: no-console

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


const arrayVertexData = new Float32Array([
	0,0,				1,0,0,
	0.00000,1.00000,	1,0,0,
	0.95106,0.30902,	1,0,0,

	0,0,				0,1,0,
	0.95106,0.30902,	0,1,0,
	0.58779,-.80902,	0,1,0,

	0,0,				0,0,1,
	0.58779,-.80902,	0,0,1,
	-.58779,-.80902,	0,0,1,

	0,0,				1,1,0,
	-.58779,-.80902,	1,1,0,
	-.95106,0.30902,	1,1,0,

	0,0,				1,0,1,
	-.95106,0.30902,	1,0,1,
	0.00000,1.00000,	1,0,1,
]);

const elementVertexData = new Float32Array([
	0,0,				0,0,0,
	0.00000,1.00000,	1,0,0,
	0.95106,0.30902,	0,1,0,
	0.58779,-.80902,	0,0,1,
	-.58779,-.80902,	1,1,0,
	-.95106,0.30902,	1,0,1,
]);

const elementIndexData = new Uint8Array([
	0,1,2,
	0,2,3,
	0,3,4,
	0,4,5,
	0,5,1,
]);

const arrayVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, arrayVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, arrayVertexData, gl.STATIC_DRAW);

const elementVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, elementVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, elementVertexData, gl.STATIC_DRAW);

const elementIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elementIndexData, gl.STATIC_DRAW);

// For `drawArrays()` to work, we must rebind the arrayVertexBuffer
// before calling gl.vertexAttribPointer()
// gl.bindBuffer(gl.ARRAY_BUFFER, arrayVertexBuffer);

gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 5*4, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 5*4, 2*4);

gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

// gl.drawArrays(gl.TRIANGLES, 0, 15);
gl.drawElements(gl.TRIANGLES, 15, gl.UNSIGNED_BYTE, 0);
