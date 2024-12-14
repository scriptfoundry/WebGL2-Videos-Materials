import { mat4 } from 'gl-matrix'; // Use this if you're using a packager
// const {mat4} = glMatrix; // Otherwise, use this. Get `gl-matrix.js` from here: https://glmatrix.net/

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const MSAA_SAMPLES_PER_PIXEL = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
const WIDTH = gl.canvas.width;
const HEIGHT = gl.canvas.height;

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
        console.log(`vertex shader log: ${gl.getShaderInfoLog(vertexShader)}\n${vs}`);
        console.log(`fragment shader log: ${gl.getShaderInfoLog(fragmentShader)}\n${fs}`);
    }

    return program;
};

const createGeometryRenderer = (gl) => {
	const vertexShader = `#version 300 es
		#pragma vscode_glsllint_stage: vert

		uniform mat4 uModel;
		uniform mat4 uView;
		uniform mat4 uProjection;

		layout(location=0) in vec4 aPosition;
		layout(location=1) in vec3 aNormal;
		layout(location=2) in vec2 aTexCoord;

		out vec2 vTexCoord;
		out vec3 vNormal;

		void main ()
		{
			gl_Position = uProjection * uView * uModel * aPosition;
			vNormal = aNormal;
			vTexCoord = aTexCoord;
		}
	`;
	const fragmentShader = `#version 300 es
		#pragma vscode_glsllint_stage: frag
		precision mediump float;

		uniform sampler2D uSampler;

		in vec2 vTexCoord;
		in vec3 vNormal;

		out vec4 fragColor;

		void main()
		{
			fragColor = texture(uSampler, vTexCoord);
		}
	`;

	const vertexData = new Float32Array([
		// POS(vec3), NORM(vec3), UV(vec2)
		-0.472715,-0.591674,-0.803878,0,-0.5628,0.8266,0.307508,0.5,
		-0.706554,-0.00998,-0.407816,0,-0.5628,0.8266,0.17432,0.5,
		-0.941498,-0.204183,-0.540044,0,-0.5628,0.8266,0.307508,0.5,
		0.472715,-0.591674,-0.803878,0.7071,0.5845,0.398,0.307508,0.5,
		0.23777,-0.770589,-0.123654,0.7071,0.5845,0.398,0.17432,0.5,
		0.472715,-0.964792,-0.255882,0.7071,0.5845,0.398,0.307508,0.5,
		-0.472715,0.964792,0.255882,-0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.23777,0.397471,0.67165,-0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.472715,0.591674,0.803878,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0.468784,-0.562805,0.82659,-0.7071,0.5845,0.398,0.307508,0.5,
		0,-0.763298,0.288112,-0.7071,0.5845,0.398,0.17432,0.5,
		0,-0.950297,0.562756,-0.7071,0.5845,0.398,0.307508,0.5,
		-0.468784,0.562805,-0.82659,0.7071,0.5845,0.398,0.307508,0.5,
		0,-0.011686,-0.815779,0.7071,0.5845,0.398,0.17432,0.5,
		0,0.175313,-1.090424,0.7071,0.5845,0.398,0.307508,0.5,
		0.941498,-0.204183,-0.540044,0,-0.5628,0.8266,0.307508,0.5,
		0.23777,-0.397471,-0.67165,0,-0.5628,0.8266,0.17432,0.5,
		0.472715,-0.591674,-0.803878,0,-0.5628,0.8266,0.307508,0.5,
		-1.414214,-0.562805,0.82659,-0.7071,0.5845,0.398,0.844416,0.5,
		-0.472715,0.591674,0.803878,-0.7071,0.5845,0.398,0.684426,0.5,
		-0.941498,0.204183,0.540044,-0.7071,0.5845,0.398,0.735019,0.5,
		0,0.606169,1.622516,-0.7071,0.5845,0.398,0.684426,0.5,
		-0.472715,0.964792,0.255882,-0.7071,0.5845,0.398,0.640488,0.5,
		-0.472715,0.591674,0.803878,-0.7071,0.5845,0.398,0.684426,0.5,
		-1.414214,0.562805,-0.82659,-0.7071,0.5845,0.398,0.684426,0.5,
		-0.472715,0.964792,0.255882,-0.7071,0.5845,0.398,0.640488,0.5,
		0,1.731779,-0.030663,-0.7071,0.5845,0.398,0.5554,0.5,
		-1.414214,-0.562805,0.82659,-0.7071,0.5845,0.398,0.844416,0.5,
		-0.941498,0.5773,-0.007952,-0.7071,0.5845,0.398,0.684426,0.5,
		-1.414214,0.562805,-0.82659,-0.7071,0.5845,0.398,0.684426,0.5,
		0,1.731779,-0.030663,0,0.5628,-0.8266,0.5554,0.5,
		-0.468784,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		-1.414214,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		1.414214,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		0,0.950297,-0.562756,0,0.5628,-0.8266,0.640488,0.5,
		0,1.731779,-0.030663,0,0.5628,-0.8266,0.5554,0.5,
		1.414214,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		0,0.175313,-1.090424,0,0.5628,-0.8266,0.735019,0.5,
		0.468784,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		-1.414214,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		0,0.175313,-1.090424,0,0.5628,-0.8266,0.735019,0.5,
		0,-0.606169,-1.622516,0,0.5628,-0.8266,0.844416,0.5,
		1.414214,0.562805,-0.82659,0.7071,-0.5845,-0.398,0.684426,0.5,
		0.472715,-0.591674,-0.803878,0.7071,-0.5845,-0.398,0.785788,0.5,
		0,-0.606169,-1.622516,0.7071,-0.5845,-0.398,0.785788,0.5,
		1.414214,-0.562805,0.82659,0.7071,-0.5845,-0.398,0.785788,0.5,
		0.941498,-0.204183,-0.540044,0.7071,-0.5845,-0.398,0.735019,0.5,
		1.414214,0.562805,-0.82659,0.7071,-0.5845,-0.398,0.684426,0.5,
		0,-1.731779,0.030663,0.7071,-0.5845,-0.398,0.936741,0.5,
		0.941499,-0.5773,0.007952,0.7071,-0.5845,-0.398,0.785788,0.5,
		1.414214,-0.562805,0.82659,0.7071,-0.5845,-0.398,0.785788,0.5,
		0,-0.606169,-1.622516,0.7071,-0.5845,-0.398,0.785788,0.5,
		0.472715,-0.964792,-0.255882,0.7071,-0.5845,-0.398,0.844416,0.5,
		0,-1.731779,0.030663,0.7071,-0.5845,-0.398,0.936741,0.5,
		1.414214,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		0,-0.950297,0.562756,0,-0.5628,0.8266,0.844416,0.5,
		0,-1.731779,0.030663,0,-0.5628,0.8266,0.936741,0.5,
		1.414214,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		0,-0.175313,1.090424,0,-0.5628,0.8266,0.735019,0.5,
		0.468784,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		-1.414214,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		0,-0.175313,1.090424,0,-0.5628,0.8266,0.735019,0.5,
		0,0.606169,1.622516,0,-0.5628,0.8266,0.640488,0.5,
		0,-1.731779,0.030663,0,-0.5628,0.8266,0.936741,0.5,
		-0.468784,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		-1.414214,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		-1.414214,0.562805,-0.82659,-0.7071,-0.5845,-0.398,0.640488,0.5,
		-0.472715,-0.591674,-0.803878,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-0.941498,-0.204183,-0.540044,-0.7071,-0.5845,-0.398,0.735019,0.5,
		0,-0.606169,-1.622516,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-0.472715,-0.964792,-0.255882,-0.7071,-0.5845,-0.398,0.844416,0.5,
		-0.472715,-0.591674,-0.803878,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-1.414214,-0.562805,0.82659,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-0.472715,-0.964792,-0.255882,-0.7071,-0.5845,-0.398,0.844416,0.5,
		0,-1.731779,0.030663,-0.7071,-0.5845,-0.398,0.936741,0.5,
		-1.414214,0.562805,-0.82659,-0.7071,-0.5845,-0.398,0.640488,0.5,
		-0.941498,-0.5773,0.007952,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-1.414214,-0.562805,0.82659,-0.7071,-0.5845,-0.398,0.785788,0.5,
		0,1.731779,-0.030663,0.7071,0.5845,0.398,0.5554,0.5,
		0.941499,0.5773,-0.007952,0.7071,0.5845,0.398,0.684426,0.5,
		1.414214,0.562805,-0.82659,0.7071,0.5845,0.398,0.684426,0.5,
		0,0.606169,1.622516,0.7071,0.5845,0.398,0.684426,0.5,
		0.472715,0.964792,0.255882,0.7071,0.5845,0.398,0.640488,0.5,
		0,1.731779,-0.030663,0.7071,0.5845,0.398,0.5554,0.5,
		1.414214,-0.562805,0.82659,0.7071,0.5845,0.398,0.844416,0.5,
		0.472715,0.591674,0.803878,0.7071,0.5845,0.398,0.684426,0.5,
		0,0.606169,1.622516,0.7071,0.5845,0.398,0.684426,0.5,
		1.414214,0.562805,-0.82659,0.7071,0.5845,0.398,0.684426,0.5,
		0.941498,0.204183,0.540044,0.7071,0.5845,0.398,0.735019,0.5,
		1.414214,-0.562805,0.82659,0.7071,0.5845,0.398,0.844416,0.5,
		-0.23777,0.397471,0.67165,-0.7071,0.5845,0.398,0.058789,0.5,
		-0.706554,0.383097,-0.14018,-0.7071,0.5845,0.398,0.058789,0.5,
		-0.706554,0.00998,0.407816,-0.7071,0.5845,0.398,0.058789,0.5,
		0,0.763298,-0.288112,0,0.5628,-0.8266,0.058789,0.5,
		0,-0.011686,-0.815779,0,0.5628,-0.8266,0.058789,0.5,
		-0.468784,0.375806,-0.551945,0,0.5628,-0.8266,0.058789,0.5,
		0.706554,-0.00998,-0.407816,0.7071,-0.5845,-0.398,0.058789,0.5,
		0.23777,-0.770589,-0.123654,0.7071,-0.5845,-0.398,0.058789,0.5,
		0.23777,-0.397471,-0.67165,0.7071,-0.5845,-0.398,0.058789,0.5,
		0.468784,-0.375806,0.551945,0,-0.5628,0.8266,0.058789,0.5,
		-0.468784,-0.375806,0.551945,0,-0.5628,0.8266,0.058789,0.5,
		0,-0.763298,0.288112,0,-0.5628,0.8266,0.058789,0.5,
		-0.23777,-0.397471,-0.67165,-0.7071,-0.5845,-0.398,0.058789,0.5,
		-0.706554,-0.383097,0.14018,-0.7071,-0.5845,-0.398,0.058789,0.5,
		-0.706554,-0.00998,-0.407816,-0.7071,-0.5845,-0.398,0.058789,0.5,
		0.23777,0.770589,0.123654,0.7071,0.5845,0.398,0.058789,0.5,
		0.706554,0.00998,0.407816,0.7071,0.5845,0.398,0.058789,0.5,
		0.706554,0.383097,-0.14018,0.7071,0.5845,0.398,0.058789,0.5,
		0.468784,0.562805,-0.82659,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0,0.763298,-0.288112,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0,0.950297,-0.562756,-0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.468784,-0.562805,0.82659,0.7071,0.5845,0.398,0.307508,0.5,
		0,-0.763298,0.288112,0.7071,0.5845,0.398,0.17432,0.5,
		-0.468784,-0.375806,0.551945,0.7071,0.5845,0.398,0.17432,0.5,
		0.472715,0.964792,0.255882,0,-0.5628,0.8266,0.307508,0.5,
		0.706554,0.383097,-0.14018,0,-0.5628,0.8266,0.17432,0.5,
		0.941499,0.5773,-0.007952,0,-0.5628,0.8266,0.307508,0.5,
		-0.941498,0.5773,-0.007952,0,-0.5628,0.8266,0.307508,0.5,
		-0.23777,0.770589,0.123654,0,-0.5628,0.8266,0.17432,0.5,
		-0.472715,0.964792,0.255882,0,-0.5628,0.8266,0.307508,0.5,
		0.941499,-0.5773,0.007952,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0.706554,-0.00998,-0.407816,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0.941498,-0.204183,-0.540044,-0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.941498,-0.204183,-0.540044,0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.706554,-0.383097,0.14018,0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.941498,-0.5773,0.007952,0.7071,-0.5845,-0.398,0.307508,0.5,
		0.468784,0.562805,-0.82659,-0.7071,0.5845,0.398,0.307508,0.5,
		0,-0.011686,-0.815779,-0.7071,0.5845,0.398,0.17432,0.5,
		0.468784,0.375806,-0.551945,-0.7071,0.5845,0.398,0.17432,0.5,
		0.468784,-0.562805,0.82659,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0,0.011686,0.815779,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0.468784,-0.375806,0.551945,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0.941499,0.5773,-0.007952,-0.7071,0.5845,0.398,0.307508,0.5,
		0.706554,0.00998,0.407816,-0.7071,0.5845,0.398,0.17432,0.5,
		0.941498,0.204183,0.540044,-0.7071,0.5845,0.398,0.307508,0.5,
		0.472715,-0.964792,-0.255882,0,0.5628,-0.8266,0.307508,0.5,
		0.706554,-0.383097,0.14018,0,0.5628,-0.8266,0.17432,0.5,
		0.941499,-0.5773,0.007952,0,0.5628,-0.8266,0.307508,0.5,
		-0.472715,-0.964792,-0.255882,-0.7071,0.5845,0.398,0.307508,0.5,
		-0.23777,-0.397471,-0.67165,-0.7071,0.5845,0.398,0.17432,0.5,
		-0.472715,-0.591674,-0.803878,-0.7071,0.5845,0.398,0.307508,0.5,
		-0.468784,-0.562805,0.82659,0.7071,-0.5845,-0.398,0.307508,0.5,
		0,0.011686,0.815779,0.7071,-0.5845,-0.398,0.17432,0.5,
		0,-0.175313,1.090424,0.7071,-0.5845,-0.398,0.307508,0.5,
		0.472715,0.591674,0.803878,0.7071,-0.5845,-0.398,0.307508,0.5,
		0.23777,0.770589,0.123654,0.7071,-0.5845,-0.398,0.17432,0.5,
		0.472715,0.964792,0.255882,0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.941498,-0.5773,0.007952,0,0.5628,-0.8266,0.307508,0.5,
		-0.23777,-0.770589,-0.123654,0,0.5628,-0.8266,0.17432,0.5,
		-0.472715,-0.964792,-0.255882,0,0.5628,-0.8266,0.307508,0.5,
		0.941498,0.204183,0.540044,0,0.5628,-0.8266,0.307508,0.5,
		0.23777,0.397471,0.67165,0,0.5628,-0.8266,0.17432,0.5,
		0.472715,0.591674,0.803878,0,0.5628,-0.8266,0.307508,0.5,
		-0.472715,0.591674,0.803878,0,0.5628,-0.8266,0.307508,0.5,
		-0.706554,0.00998,0.407816,0,0.5628,-0.8266,0.17432,0.5,
		-0.941498,0.204183,0.540044,0,0.5628,-0.8266,0.307508,0.5,
		-0.468784,0.562805,-0.82659,0.7071,-0.5845,-0.398,0.307508,0.5,
		0,0.763298,-0.288112,0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.468784,0.375806,-0.551945,0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.941498,0.204183,0.540044,0.7071,0.5845,0.398,0.307508,0.5,
		-0.706554,0.383097,-0.14018,0.7071,0.5845,0.398,0.17432,0.5,
		-0.941498,0.5773,-0.007952,0.7071,0.5845,0.398,0.307508,0.5,
		-0.472715,-0.591674,-0.803878,0,-0.5628,0.8266,0.307508,0.5,
		-0.23777,-0.397471,-0.67165,0,-0.5628,0.8266,0.17432,0.5,
		-0.706554,-0.00998,-0.407816,0,-0.5628,0.8266,0.17432,0.5,
		0.472715,-0.591674,-0.803878,0.7071,0.5845,0.398,0.307508,0.5,
		0.23777,-0.397471,-0.67165,0.7071,0.5845,0.398,0.17432,0.5,
		0.23777,-0.770589,-0.123654,0.7071,0.5845,0.398,0.17432,0.5,
		-0.472715,0.964792,0.255882,-0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.23777,0.770589,0.123654,-0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.23777,0.397471,0.67165,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0.468784,-0.562805,0.82659,-0.7071,0.5845,0.398,0.307508,0.5,
		0.468784,-0.375806,0.551945,-0.7071,0.5845,0.398,0.17432,0.5,
		0,-0.763298,0.288112,-0.7071,0.5845,0.398,0.17432,0.5,
		-0.468784,0.562805,-0.82659,0.7071,0.5845,0.398,0.307508,0.5,
		-0.468784,0.375806,-0.551945,0.7071,0.5845,0.398,0.17432,0.5,
		0,-0.011686,-0.815779,0.7071,0.5845,0.398,0.17432,0.5,
		0.941498,-0.204183,-0.540044,0,-0.5628,0.8266,0.307508,0.5,
		0.706554,-0.00998,-0.407816,0,-0.5628,0.8266,0.17432,0.5,
		0.23777,-0.397471,-0.67165,0,-0.5628,0.8266,0.17432,0.5,
		-1.414214,-0.562805,0.82659,-0.7071,0.5845,0.398,0.844416,0.5,
		0,0.606169,1.622516,-0.7071,0.5845,0.398,0.684426,0.5,
		-0.472715,0.591674,0.803878,-0.7071,0.5845,0.398,0.684426,0.5,
		0,0.606169,1.622516,-0.7071,0.5845,0.398,0.684426,0.5,
		0,1.731779,-0.030663,-0.7071,0.5845,0.398,0.5554,0.5,
		-0.472715,0.964792,0.255882,-0.7071,0.5845,0.398,0.640488,0.5,
		-1.414214,0.562805,-0.82659,-0.7071,0.5845,0.398,0.684426,0.5,
		-0.941498,0.5773,-0.007952,-0.7071,0.5845,0.398,0.684426,0.5,
		-0.472715,0.964792,0.255882,-0.7071,0.5845,0.398,0.640488,0.5,
		-1.414214,-0.562805,0.82659,-0.7071,0.5845,0.398,0.844416,0.5,
		-0.941498,0.204183,0.540044,-0.7071,0.5845,0.398,0.735019,0.5,
		-0.941498,0.5773,-0.007952,-0.7071,0.5845,0.398,0.684426,0.5,
		0,1.731779,-0.030663,0,0.5628,-0.8266,0.5554,0.5,
		0,0.950297,-0.562756,0,0.5628,-0.8266,0.640488,0.5,
		-0.468784,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		1.414214,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		0.468784,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		0,0.950297,-0.562756,0,0.5628,-0.8266,0.640488,0.5,
		1.414214,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		0,-0.606169,-1.622516,0,0.5628,-0.8266,0.844416,0.5,
		0,0.175313,-1.090424,0,0.5628,-0.8266,0.735019,0.5,
		-1.414214,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		-0.468784,0.562805,-0.82659,0,0.5628,-0.8266,0.684426,0.5,
		0,0.175313,-1.090424,0,0.5628,-0.8266,0.735019,0.5,
		1.414214,0.562805,-0.82659,0.7071,-0.5845,-0.398,0.684426,0.5,
		0.941498,-0.204183,-0.540044,0.7071,-0.5845,-0.398,0.735019,0.5,
		0.472715,-0.591674,-0.803878,0.7071,-0.5845,-0.398,0.785788,0.5,
		1.414214,-0.562805,0.82659,0.7071,-0.5845,-0.398,0.785788,0.5,
		0.941499,-0.5773,0.007952,0.7071,-0.5845,-0.398,0.785788,0.5,
		0.941498,-0.204183,-0.540044,0.7071,-0.5845,-0.398,0.735019,0.5,
		0,-1.731779,0.030663,0.7071,-0.5845,-0.398,0.936741,0.5,
		0.472715,-0.964792,-0.255882,0.7071,-0.5845,-0.398,0.844416,0.5,
		0.941499,-0.5773,0.007952,0.7071,-0.5845,-0.398,0.785788,0.5,
		0,-0.606169,-1.622516,0.7071,-0.5845,-0.398,0.785788,0.5,
		0.472715,-0.591674,-0.803878,0.7071,-0.5845,-0.398,0.785788,0.5,
		0.472715,-0.964792,-0.255882,0.7071,-0.5845,-0.398,0.844416,0.5,
		1.414214,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		0.468784,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		0,-0.950297,0.562756,0,-0.5628,0.8266,0.844416,0.5,
		1.414214,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		0,0.606169,1.622516,0,-0.5628,0.8266,0.640488,0.5,
		0,-0.175313,1.090424,0,-0.5628,0.8266,0.735019,0.5,
		-1.414214,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		-0.468784,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		0,-0.175313,1.090424,0,-0.5628,0.8266,0.735019,0.5,
		0,-1.731779,0.030663,0,-0.5628,0.8266,0.936741,0.5,
		0,-0.950297,0.562756,0,-0.5628,0.8266,0.844416,0.5,
		-0.468784,-0.562805,0.82659,0,-0.5628,0.8266,0.785788,0.5,
		-1.414214,0.562805,-0.82659,-0.7071,-0.5845,-0.398,0.640488,0.5,
		0,-0.606169,-1.622516,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-0.472715,-0.591674,-0.803878,-0.7071,-0.5845,-0.398,0.785788,0.5,
		0,-0.606169,-1.622516,-0.7071,-0.5845,-0.398,0.785788,0.5,
		0,-1.731779,0.030663,-0.7071,-0.5845,-0.398,0.936741,0.5,
		-0.472715,-0.964792,-0.255882,-0.7071,-0.5845,-0.398,0.844416,0.5,
		-1.414214,-0.562805,0.82659,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-0.941498,-0.5773,0.007952,-0.7071,-0.5845,-0.398,0.785788,0.5,
		-0.472715,-0.964792,-0.255882,-0.7071,-0.5845,-0.398,0.844416,0.5,
		-1.414214,0.562805,-0.82659,-0.7071,-0.5845,-0.398,0.640488,0.5,
		-0.941498,-0.204183,-0.540044,-0.7071,-0.5845,-0.398,0.735019,0.5,
		-0.941498,-0.5773,0.007952,-0.7071,-0.5845,-0.398,0.785788,0.5,
		0,1.731779,-0.030663,0.7071,0.5845,0.398,0.5554,0.5,
		0.472715,0.964792,0.255882,0.7071,0.5845,0.398,0.640488,0.5,
		0.941499,0.5773,-0.007952,0.7071,0.5845,0.398,0.684426,0.5,
		0,0.606169,1.622516,0.7071,0.5845,0.398,0.684426,0.5,
		0.472715,0.591674,0.803878,0.7071,0.5845,0.398,0.684426,0.5,
		0.472715,0.964792,0.255882,0.7071,0.5845,0.398,0.640488,0.5,
		1.414214,-0.562805,0.82659,0.7071,0.5845,0.398,0.844416,0.5,
		0.941498,0.204183,0.540044,0.7071,0.5845,0.398,0.735019,0.5,
		0.472715,0.591674,0.803878,0.7071,0.5845,0.398,0.684426,0.5,
		1.414214,0.562805,-0.82659,0.7071,0.5845,0.398,0.684426,0.5,
		0.941499,0.5773,-0.007952,0.7071,0.5845,0.398,0.684426,0.5,
		0.941498,0.204183,0.540044,0.7071,0.5845,0.398,0.735019,0.5,
		-0.23777,0.397471,0.67165,-0.7071,0.5845,0.398,0.058789,0.5,
		-0.23777,0.770589,0.123654,-0.7071,0.5845,0.398,0.058789,0.5,
		-0.706554,0.383097,-0.14018,-0.7071,0.5845,0.398,0.058789,0.5,
		0,0.763298,-0.288112,0,0.5628,-0.8266,0.058789,0.5,
		0.468784,0.375806,-0.551945,0,0.5628,-0.8266,0.058789,0.5,
		0,-0.011686,-0.815779,0,0.5628,-0.8266,0.058789,0.5,
		0.706554,-0.00998,-0.407816,0.7071,-0.5845,-0.398,0.058789,0.5,
		0.706554,-0.383097,0.14018,0.7071,-0.5845,-0.398,0.058789,0.5,
		0.23777,-0.770589,-0.123654,0.7071,-0.5845,-0.398,0.058789,0.5,
		0.468784,-0.375806,0.551945,0,-0.5628,0.8266,0.058789,0.5,
		0,0.011686,0.815779,0,-0.5628,0.8266,0.058789,0.5,
		-0.468784,-0.375806,0.551945,0,-0.5628,0.8266,0.058789,0.5,
		-0.23777,-0.397471,-0.67165,-0.7071,-0.5845,-0.398,0.058789,0.5,
		-0.23777,-0.770589,-0.123654,-0.7071,-0.5845,-0.398,0.058789,0.5,
		-0.706554,-0.383097,0.14018,-0.7071,-0.5845,-0.398,0.058789,0.5,
		0.23777,0.770589,0.123654,0.7071,0.5845,0.398,0.058789,0.5,
		0.23777,0.397471,0.67165,0.7071,0.5845,0.398,0.058789,0.5,
		0.706554,0.00998,0.407816,0.7071,0.5845,0.398,0.058789,0.5,
		0.468784,0.562805,-0.82659,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0.468784,0.375806,-0.551945,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0,0.763298,-0.288112,-0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.468784,-0.562805,0.82659,0.7071,0.5845,0.398,0.307508,0.5,
		0,-0.950297,0.562756,0.7071,0.5845,0.398,0.307508,0.5,
		0,-0.763298,0.288112,0.7071,0.5845,0.398,0.17432,0.5,
		0.472715,0.964792,0.255882,0,-0.5628,0.8266,0.307508,0.5,
		0.23777,0.770589,0.123654,0,-0.5628,0.8266,0.17432,0.5,
		0.706554,0.383097,-0.14018,0,-0.5628,0.8266,0.17432,0.5,
		-0.941498,0.5773,-0.007952,0,-0.5628,0.8266,0.307508,0.5,
		-0.706554,0.383097,-0.14018,0,-0.5628,0.8266,0.17432,0.5,
		-0.23777,0.770589,0.123654,0,-0.5628,0.8266,0.17432,0.5,
		0.941499,-0.5773,0.007952,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0.706554,-0.383097,0.14018,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0.706554,-0.00998,-0.407816,-0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.941498,-0.204183,-0.540044,0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.706554,-0.00998,-0.407816,0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.706554,-0.383097,0.14018,0.7071,-0.5845,-0.398,0.17432,0.5,
		0.468784,0.562805,-0.82659,-0.7071,0.5845,0.398,0.307508,0.5,
		0,0.175313,-1.090424,-0.7071,0.5845,0.398,0.307508,0.5,
		0,-0.011686,-0.815779,-0.7071,0.5845,0.398,0.17432,0.5,
		0.468784,-0.562805,0.82659,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0,-0.175313,1.090424,-0.7071,-0.5845,-0.398,0.307508,0.5,
		0,0.011686,0.815779,-0.7071,-0.5845,-0.398,0.17432,0.5,
		0.941499,0.5773,-0.007952,-0.7071,0.5845,0.398,0.307508,0.5,
		0.706554,0.383097,-0.14018,-0.7071,0.5845,0.398,0.17432,0.5,
		0.706554,0.00998,0.407816,-0.7071,0.5845,0.398,0.17432,0.5,
		0.472715,-0.964792,-0.255882,0,0.5628,-0.8266,0.307508,0.5,
		0.23777,-0.770589,-0.123654,0,0.5628,-0.8266,0.17432,0.5,
		0.706554,-0.383097,0.14018,0,0.5628,-0.8266,0.17432,0.5,
		-0.472715,-0.964792,-0.255882,-0.7071,0.5845,0.398,0.307508,0.5,
		-0.23777,-0.770589,-0.123654,-0.7071,0.5845,0.398,0.17432,0.5,
		-0.23777,-0.397471,-0.67165,-0.7071,0.5845,0.398,0.17432,0.5,
		-0.468784,-0.562805,0.82659,0.7071,-0.5845,-0.398,0.307508,0.5,
		-0.468784,-0.375806,0.551945,0.7071,-0.5845,-0.398,0.17432,0.5,
		0,0.011686,0.815779,0.7071,-0.5845,-0.398,0.17432,0.5,
		0.472715,0.591674,0.803878,0.7071,-0.5845,-0.398,0.307508,0.5,
		0.23777,0.397471,0.67165,0.7071,-0.5845,-0.398,0.17432,0.5,
		0.23777,0.770589,0.123654,0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.941498,-0.5773,0.007952,0,0.5628,-0.8266,0.307508,0.5,
		-0.706554,-0.383097,0.14018,0,0.5628,-0.8266,0.17432,0.5,
		-0.23777,-0.770589,-0.123654,0,0.5628,-0.8266,0.17432,0.5,
		0.941498,0.204183,0.540044,0,0.5628,-0.8266,0.307508,0.5,
		0.706554,0.00998,0.407816,0,0.5628,-0.8266,0.17432,0.5,
		0.23777,0.397471,0.67165,0,0.5628,-0.8266,0.17432,0.5,
		-0.472715,0.591674,0.803878,0,0.5628,-0.8266,0.307508,0.5,
		-0.23777,0.397471,0.67165,0,0.5628,-0.8266,0.17432,0.5,
		-0.706554,0.00998,0.407816,0,0.5628,-0.8266,0.17432,0.5,
		-0.468784,0.562805,-0.82659,0.7071,-0.5845,-0.398,0.307508,0.5,
		0,0.950297,-0.562756,0.7071,-0.5845,-0.398,0.307508,0.5,
		0,0.763298,-0.288112,0.7071,-0.5845,-0.398,0.17432,0.5,
		-0.941498,0.204183,0.540044,0.7071,0.5845,0.398,0.307508,0.5,
		-0.706554,0.00998,0.407816,0.7071,0.5845,0.398,0.17432,0.5,
		-0.706554,0.383097,-0.14018,0.7071,0.5845,0.398,0.17432,0.5
	]);

	const program = createWebGLProgram(gl, vertexShader, fragmentShader);

	const modelLocation = gl.getUniformLocation(program, 'uModel');
	const viewLocation = gl.getUniformLocation(program, 'uView');
	const projectionLocation = gl.getUniformLocation(program, 'uProjection');

	const modelMatrix = mat4.create();
	const viewMatrix = mat4.lookAt(mat4.create(), [4,.5,4], [0,0,0], [0,1,0]);
	const projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 4, 1, .1, 14);

	gl.useProgram(program);
	gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
	gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
	gl.useProgram(null);

	// Scaling factor for the HDR color:
	const S = 3;

	const textureColours = new Float32Array([
		// R,		G,			B,
		246 * S,	205 * S,	38 * S, // HDR glowing yellow color = LDR yellow * 3
		172,		107,		38,
		 86,		 50,		38,
		 51,		 28,		23,
		187,		127,		87,
		114,		 89,		86,
		 57,		 57,		57,
		 48,		 40,		32,
	]).map(v => v / 255); // Change to an HDR normalized float

	const colorTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
	gl.activeTexture(gl.TEXTURE0);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.R11F_G11F_B10F, textureColours.length / 3,1,0, gl.RGB, gl.FLOAT, textureColours);
	// For FP texture:                 ⇧ Internal format                                         ⇧ Float type

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.bindTexture(gl.TEXTURE_2D, null);

	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
	gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
	gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);
	gl.enableVertexAttribArray(2);

	gl.bindVertexArray(null);

	gl.clearColor(0,0,.2,1)

	let timeOfLastUpdate = 0;
	return (timeOfCurrentUpdate) => {
		const deltaTime = timeOfCurrentUpdate - timeOfLastUpdate;
		timeOfLastUpdate = timeOfCurrentUpdate;

		gl.useProgram(program);
		gl.bindVertexArray(vao);
		gl.enable(gl.DEPTH_TEST)
		gl.enable(gl.CULL_FACE);

		mat4.rotateY(modelMatrix, modelMatrix, deltaTime/2000);
		gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 8);

		gl.disable(gl.CULL_FACE);
		gl.disable(gl.DEPTH_TEST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindVertexArray(null);
		gl.useProgram(null);
	};
};

const createMultisampleFramebuffer = (gl, width, height) => {
	const colorRenderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
	gl.renderbufferStorageMultisample(gl.RENDERBUFFER, MSAA_SAMPLES_PER_PIXEL, gl.R11F_G11F_B10F, width, height);

	const depthRenderbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
	gl.renderbufferStorageMultisample(gl.RENDERBUFFER, MSAA_SAMPLES_PER_PIXEL, gl.DEPTH_COMPONENT16, width, height);

	const framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);

	return framebuffer;
};
const blit = (gl, source, dest) => {
	gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source);
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dest);

	gl.readBuffer(gl.COLOR_ATTACHMENT0);
	gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

	gl.blitFramebuffer(0,0,WIDTH,HEIGHT,  0,0,WIDTH,HEIGHT,  gl.COLOR_BUFFER_BIT, gl.NEAREST);

	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
	gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
};

const createFramebufferBundle = (gl, width, height) => {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R11F_G11F_B10F, width, height);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	const framebuffer = gl.createFramebuffer();

	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return { framebuffer, texture, outputSize: [width, height], texelSize: [1/width, 1/height] };
};

const createQuadRenderer = (gl, fragmentShader) => {
	const vertexShader = `#version 300 es
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
	if (!fragmentShader) fragmentShader = `#version 300 es
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

	const vertices = new Float32Array([
		-1,1,	0,1,
		-1,-1,	0,0,
		1,1,	1,1,
		1,-1,	1,0,
	]);

	const program = createWebGLProgram(gl, vertexShader, fragmentShader);
	const quadVAO = gl.createVertexArray();
	gl.bindVertexArray(quadVAO);

	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);

	gl.bindVertexArray(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);


	const draw = (inputTextures, outputFBO) => {
		gl.useProgram(program);
		gl.bindVertexArray(quadVAO);

		for (let i = 0; i < inputTextures.length; i++) {
			gl.activeTexture(gl.TEXTURE0 + i);
			gl.bindTexture(gl.TEXTURE_2D, inputTextures[i]);
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, outputFBO || null);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindVertexArray(null);
		gl.useProgram(null);
	};

	return { program, draw };
};
const createThresholdRenderer = (gl) => {
	const fragmentShader = `#version 300 es
		#pragma vscode_glsllint_stage: frag

		precision mediump float;

		uniform sampler2D sampler;

		in vec2 vTexCoord;

		out vec4 fragColor;

		const float luminanceCutoff = .9;

		void main()
		{
			fragColor = texture(sampler, vTexCoord);
			float luminance = dot(fragColor.rgb, vec3(0.30, 0.59, 0.11));
			fragColor = luminance > luminanceCutoff ? fragColor : vec4(0,0,0,0);
			fragColor.a = 1.0;
		}
	`;

	// Create the WebGL program
	const thresholdQuadProgram = createQuadRenderer(gl, fragmentShader);

	// Setup: none

	// Render-loop function
	return (source, destination) => {
		thresholdQuadProgram.draw([source.texture], destination?.framebuffer || null);
	};
};
const createDownsampleBlurRenderer = (gl) => {
	const fragmentShader = `#version 300 es
		#pragma vscode_glsllint_stage: frag
		precision mediump float;

		uniform sampler2D sampler;
		uniform vec2 uTexelSize;

		in vec2 vTexCoord;

		out vec4 fragColor;

		void main()
		{
			vec3 A = texture(sampler, vTexCoord + uTexelSize * vec2(-1.0,  1.0)).rgb;
			vec3 B = texture(sampler, vTexCoord + uTexelSize * vec2( 0.0,  1.0)).rgb;
			vec3 C = texture(sampler, vTexCoord + uTexelSize * vec2( 1.0,  1.0)).rgb;
			vec3 D = texture(sampler, vTexCoord + uTexelSize * vec2(-0.5,  0.5)).rgb;
			vec3 E = texture(sampler, vTexCoord + uTexelSize * vec2( 0.5,  0.5)).rgb;
			vec3 F = texture(sampler, vTexCoord + uTexelSize * vec2(-1.0,  0.0)).rgb;
			vec3 G = texture(sampler, vTexCoord                                ).rgb;
			vec3 H = texture(sampler, vTexCoord + uTexelSize * vec2( 1.0,  0.0)).rgb;
			vec3 I = texture(sampler, vTexCoord + uTexelSize * vec2(-0.5, -0.5)).rgb;
			vec3 J = texture(sampler, vTexCoord + uTexelSize * vec2( 0.5, -0.5)).rgb;
			vec3 K = texture(sampler, vTexCoord + uTexelSize * vec2(-1.0, -1.0)).rgb;
			vec3 L = texture(sampler, vTexCoord + uTexelSize * vec2( 0.0, -1.0)).rgb;
			vec3 M = texture(sampler, vTexCoord + uTexelSize * vec2( 1.0, -1.0)).rgb;

			/*  SAMPLES PATTERN
			        -1   0   1
                  + ----------
			    1 |  A   B   C
				  |    D   E
				0 |  F   G   H   ←  [0,0] = G
				  |    I   J
			   -1 |  K   L   M
			*/

			// Corner samples
			vec3 quad_NW  = (A + B + F + G) * 0.25;  // average of ABGF
			vec3 quad_NE  = (B + C + G + H) * 0.25;  // average of BCGH
			vec3 quad_SW  = (F + G + K + L) * 0.25;  // average of FGLK
			vec3 quad_SE  = (G + H + L + M) * 0.25;  // average of GHML

			// Central sample
			vec3 quad_C  = (D + E + I + J) * .25;   // average of DEIJ


			vec3 sum = 0.125 * (quad_NW + quad_NE + quad_SW + quad_SE)
					 + 0.5   * quad_C;
					 // .125 + .125 + .125 + .125 + .5 = 1.0
					 // The combined sample weights sum to exactly 1.0, so no change in brightness

			fragColor = vec4(sum, 1.0);
		}
	`;

	// Create the WebGL program
	const downsampleQuadProgram = createQuadRenderer(gl, fragmentShader);

	// Setup: grab uniform locations
	gl.useProgram(downsampleQuadProgram.program);
	const texelSizeLocation = gl.getUniformLocation(downsampleQuadProgram.program, 'uTexelSize');
	gl.useProgram(null);


	// Render-loop function
	return (source, destination) => {
		gl.useProgram(downsampleQuadProgram.program);
		gl.uniform2fv(texelSizeLocation, destination?.texelSize || [1/WIDTH,1/HEIGHT]);
		gl.viewport(0,0, ...(destination?.outputSize || [WIDTH,HEIGHT]));

		downsampleQuadProgram.draw([source.texture], destination?.framebuffer || null);

		gl.useProgram(null);
	};
};
const createUpsampleMergeRenderer = (gl) => {
	const fragmentShader = `#version 300 es
		#pragma vscode_glsllint_stage: frag

		#define BLOOM_BLENDMODE_ADD 0

		precision mediump float;

		uniform sampler2D smallerSampler;
		uniform sampler2D largerSampler;
		uniform vec2 uTexelSize;

		in vec2 vTexCoord;

		out vec4 fragColor;

		void main()
		{
			/*  SAMPLES PATTERN
			        -1   1
                  + ------
			    1 |  A   B
				  |    +      ←  + = [0,0]
			   -1 |  C   D
			*/

			// This is the single sample for the unblurred, larger texture
			vec3 largeSample = texture(largerSampler, vTexCoord).rgb;

			// These are the four samples for blurring the smaller texture
			vec3 A = texture(smallerSampler, vTexCoord + uTexelSize * vec2(-1, 1)).rgb;
			vec3 B = texture(smallerSampler, vTexCoord + uTexelSize * vec2( 1, 1)).rgb;
			vec3 C = texture(smallerSampler, vTexCoord + uTexelSize * vec2(-1,-1)).rgb;
			vec3 D = texture(smallerSampler, vTexCoord + uTexelSize * vec2( 1,-1)).rgb;

			vec3 blurSample = (A + B + C + D) * .25;

			// Add 100% of the blur sample with 100% of the larger, unblurred sample
			//                ↓blur samples↓      ↓unblurred↓
			fragColor.rgb =  blurSample      +    largeSample;

			fragColor.a = 1.0;
		}`;

	// Create the WebGL program
	const upsampleQuadProgram = createQuadRenderer(gl, fragmentShader);

	// Setup: grab uniform locations, set sampler texture slots values
	gl.useProgram(upsampleQuadProgram.program);
	const texelSizeLocation = gl.getUniformLocation(upsampleQuadProgram.program, 'uTexelSize');
	gl.uniform1i(gl.getUniformLocation(upsampleQuadProgram.program, 'smallerSampler'), 0);
	gl.uniform1i(gl.getUniformLocation(upsampleQuadProgram.program, 'largerSampler'), 1);
	gl.useProgram(null);

	// Render-loop function
	return (smallerSource, largerSource, destination) => {
		gl.useProgram(upsampleQuadProgram.program)
		gl.uniform2fv(texelSizeLocation, largerSource?.texelSize || [1/WIDTH, 1/HEIGHT]);
		gl.viewport(0,0,...(destination?.outputSize || [WIDTH,HEIGHT]));

		upsampleQuadProgram.draw([largerSource.texture, smallerSource.texture], destination?.framebuffer || null);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.useProgram(null);
	};
};
const createToneMapRenderer = (gl) => {
	const fragmentShader = `#version 300 es
		#pragma vscode_glsllint_stage: frag

		precision mediump float;

		uniform sampler2D sampler;

		in vec2 vTexCoord;

		out vec4 fragColor;


		float getLuminance(vec3 rgb)
		{
			const vec3 W = vec3(0.2125, 0.7154, 0.0721);
			return dot(rgb, W);
		}


		// Algorithms
		float filmic_reinhard2(float x) {
			x *= 1.32;
			float k = 23.0;
			return (exp(-x*k) - 1.0)/k - 1.0/(x + 1.0) + 1.0;
		}
		vec3 filmic_reinhard2(vec3 x) {
			const float W = 2.0;
			float w = filmic_reinhard2(W);
			return vec3(
				filmic_reinhard2(x.r),
				filmic_reinhard2(x.g),
				filmic_reinhard2(x.b)) / w;
		}

		vec3 linear(vec3 value, vec3 max) {
			return value / max;
		}

		vec3 nativeTanh(vec3 color) {
			return tanh(color);
		}

		// https://varietyofsound.wordpress.com/2011/02/14/efficient-tanh-computation-using-lamberts-continued-fraction/
		vec3 fastTanh(vec3 x)
		{
			vec3 x2 = x * x;
			vec3 a = x * (135135.0 + x2 * (17325.0 + x2 * (378.0 + x2)));
			vec3 b = 135135.0 + x2 * (62370.0 + x2 * (3150.0 + x2 * 28.0));
			return a / b;
		}

		// Another curve-fitting approximation. I can't find where I got this, but I think it was on Math Exchange.
		vec3 superfastTanh(vec3 x)
		{
			vec3 x2 = x * x;
			return x * (27.0 + x2) / (27.0 + 9.0*x2);
		}

		// Original Eric Reinhard 2002
		vec3 reinhard(vec3 source)
		{
			return source / (source + 1.0);
		}

		// Reinhard's updated function, which aggressively passes through 1.0 (does not approach 1.0)
		// https://bruop.github.io/tonemapping/
		vec3 reinhardExtended(vec3 source, vec3 whiteRef)
		{
			return source * (1.0 + (source / (whiteRef * whiteRef))) / (source + 1.0);
		}

		// https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
		vec3 ACES_Narkowicz(vec3 source)
		{
			const float A = 2.51;
			const float B = 0.03;
			const float C = 2.43;
			const float D = 0.59;
			const float E = 0.14;

			vec3 color = source * vec3(.6);

			return clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0);
		}

		// Polyphony's Gran Turismo tone mapper, developed by Hajime Uchimura
		// https://github.com/dmnsgn/glsl-tone-map/blob/main/uchimura.glsl
		vec3 uchimura(vec3 x, float P, float a, float m, float l, float c, float b) {
			float l0 = ((P - m) * l) / a;
			float L0 = m - m / a;
			float L1 = m + (1.0 - m) / a;
			float S0 = m + l0;
			float S1 = m + a * l0;
			float C2 = (a * P) / (P - S1);
			float CP = -C2 / P;

			vec3 w0 = vec3(1.0 - smoothstep(0.0, m, x));
			vec3 w2 = vec3(step(m + l0, x));
			vec3 w1 = vec3(1.0 - w0 - w2);

			vec3 T = vec3(m * pow(x / m, vec3(c)) + b);
			vec3 S = vec3(P - (P - S1) * exp(CP * (x - S0)));
			vec3 L = vec3(m + a * (x - m));

			return T * w0 + L * w1 + S * w2;
		}

		vec3 uchimura(vec3 x) {
			// values can be determined via https://www.desmos.com/calculator/gslcdxvipg
			const float P = 1.0;  // max display brightness
			const float a = 1.0;  // contrast
			const float m = 0.22; // linear section start
			const float l = 0.4;  // linear section length
			const float c = 1.33; // black
			const float b = 0.0;  // pedestal

			return uchimura(x, P, a, m, l, c, b);
		}

		vec3 exposure(vec3 source, float exposure)
		{
			return vec3(1.0) - exp(-source * exposure);
		}
		vec3 exposure2(vec3 source, float exposure)
		{
			return vec3(1.0) / (vec3(1.0) + exp(-vec3(exposure) * source + vec3(exposure * .5)));
		}
		vec3 fastApproxUchimura(vec3 color)
		{
			return pow(superfastTanh(pow(color, vec3(1.4))), vec3(.7));
		}

		void main()
		{
			vec3 hdrColor = texture(sampler, vTexCoord).rgb;

			// Choose which algorithm you want to try:
			// fragColor.rgb = hdrColor; // no tone mapping
			// fragColor.rgb = linear(hdrColor, vec3(2.0));
			// fragColor.rgb = reinhard(hdrColor);
			// fragColor.rgb = reinhardExtended(hdrColor, vec3(4.0, 4.0, 4.0));
			// fragColor.rgb = ACES_Narkowicz(hdrColor);
			// fragColor.rgb = filmic_reinhard2(hdrColor) * 1.0;
			// fragColor.rgb = exposure(hdrColor, 1.5);
			// fragColor.rgb = exposure2(hdrColor, 3.4);
			// fragColor.rgb = nativeTanh(hdrColor);
			// fragColor.rgb = fastTanh(hdrColor);
			// fragColor.rgb = superfastTanh(hdrColor);
			fragColor.rgb = uchimura(hdrColor);
			// fragColor.rgb = fastApproxUchimura(hdrColor);

			// Correct gamma (if needed)
			// fragColor.rgb = pow(fragColor.rgb, vec3(1.0 / 2.2	));

			fragColor.a = 1.0;
		}
	`;

	// Create the WebGL program
	const tonemapQuadProgram = createQuadRenderer(gl, fragmentShader);

	// Setup: none

	// Render-loop function
	return (source, destination) => {
		// Send output to a framebuffer object (if provided) or the canvas if not

		gl.viewport(0,0, WIDTH, HEIGHT);
		tonemapQuadProgram.draw([source.texture], destination?.framebuffer || null);
	};
};



// SET-UP PHASE:

// Necessary for using floating-point buffers
gl.getExtension('EXT_color_buffer_float');

// This creates the geometry program and gets its render-loop instruction
const drawGeometry           = createGeometryRenderer(gl);

// All of these call `createQuadRenderer()` internally & include custom fragment shader code,
// setup instructions and render-loop instructions:
const drawThreshold          = createThresholdRenderer(gl);
const drawDownsampleBlur     = createDownsampleBlurRenderer(gl);
const drawUpsampleMerge      = createUpsampleMergeRenderer(gl);
const drawToneMap            = createToneMapRenderer(gl);

// This is used only for debugger (see render loop for example usage)
const debugQuadRenderer      = createQuadRenderer(gl);

// This just creates a MSAA FBO and is used once. It gets its own function just to keep
// things short and tidy.
const geometryMultisampleFramebuffer = createMultisampleFramebuffer(gl, WIDTH, HEIGHT);

// We need 12 FBOs of varying sizes for rendering our colour data to.
// geometryFBBunder is only used as a blitting destination. The rest are regular FBOs.
const geometryFBBundle            = createFramebufferBundle(gl, WIDTH, HEIGHT);          //  480x480
const thresholdFBBundle           = createFramebufferBundle(gl, WIDTH, HEIGHT);

const downsampleBlur_240FBBundle  = createFramebufferBundle(gl, WIDTH/2,   HEIGHT/2);   // 240x240
const downsampleBlur_120FBBundle  = createFramebufferBundle(gl, WIDTH/4,   HEIGHT/4);   // 120x120
const downsampleBlur_60FBBundle   = createFramebufferBundle(gl, WIDTH/8,   HEIGHT/8);   // 60x60
const downsampleBlur_30FBBundle   = createFramebufferBundle(gl, WIDTH/16,  HEIGHT/16);  // 30x30
const downsampleBlur_15FBBundle   = createFramebufferBundle(gl, WIDTH/32,  HEIGHT/32);  // 15x15

const upsampleMerge_30FBBundle    = createFramebufferBundle(gl, WIDTH/16,  HEIGHT/16);  // blur down15 + down30 → up30
const upsampleMerge_60FBBundle    = createFramebufferBundle(gl, WIDTH/8,   HEIGHT/8);   // blur up30   + down60 → up60
const upsampleMerge_120FBBundle   = createFramebufferBundle(gl, WIDTH/4,   HEIGHT/4);   // blur up60   + down120 → up120
const upsampleMerge_240FBBundle   = createFramebufferBundle(gl, WIDTH/2,   HEIGHT/2);   // blur up120   + down240 → up240
const upsampleMerge_480FBBundle   = createFramebufferBundle(gl, WIDTH,     HEIGHT);     // blur up240   + geom  → up_final

// RENDER-LOOP PHASE
const animateNextFrame = (renderTime=0) => {
	// Stage 1: render geometry to multisample renderbuffers
	gl.bindFramebuffer(gl.FRAMEBUFFER, geometryMultisampleFramebuffer);
	// drawGeometry(renderTime);
	drawGeometry(renderTime);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// Stage 2: copy anti-aliased geometry to geometry texture
	blit(gl, geometryMultisampleFramebuffer, geometryFBBundle.framebuffer);

	// Stage 3: filter out anything that isn't bright
	//             ↓load this↓       ↓output to this↓
	drawThreshold(geometryFBBundle, thresholdFBBundle);

	// Stage 4: Downsample and blur
	//                   ↓ blur this ↓                ↓ write to this ↓
	drawDownsampleBlur(thresholdFBBundle,          downsampleBlur_240FBBundle);
	drawDownsampleBlur(downsampleBlur_240FBBundle, downsampleBlur_120FBBundle);
	drawDownsampleBlur(downsampleBlur_120FBBundle, downsampleBlur_60FBBundle);
	drawDownsampleBlur(downsampleBlur_60FBBundle,  downsampleBlur_30FBBundle);
	drawDownsampleBlur(downsampleBlur_30FBBundle,  downsampleBlur_15FBBundle);

	// Stage 5: Blur, upsample and combine (add) downsample layers
	//                   ↓ blur this ↓           ↓ add to this ↓               ↓ write to this ↓
	drawUpsampleMerge(downsampleBlur_15FBBundle, downsampleBlur_30FBBundle,  upsampleMerge_30FBBundle);
	drawUpsampleMerge(upsampleMerge_30FBBundle,  downsampleBlur_60FBBundle,  upsampleMerge_60FBBundle);
	drawUpsampleMerge(upsampleMerge_60FBBundle,  downsampleBlur_120FBBundle, upsampleMerge_120FBBundle);
	drawUpsampleMerge(upsampleMerge_120FBBundle, downsampleBlur_240FBBundle, upsampleMerge_240FBBundle);
	drawUpsampleMerge(upsampleMerge_240FBBundle, geometryFBBundle,           upsampleMerge_480FBBundle);

	// Stage 6: Tone map (and gamma correct, if necessary)
	//           ↓ tone map this ↓         ↓ send to canvas
	drawToneMap(upsampleMerge_480FBBundle, null);

	// To view a specific texture, use the debugQuadRenderer here and supply an array containing the
	// TEXTURE (not bundle) you want to view
	// debugQuadRenderer.draw([geometryFBBundle.texture], null);

	// Queue up the next animation frame
	requestAnimationFrame(animateNextFrame);
};

animateNextFrame();