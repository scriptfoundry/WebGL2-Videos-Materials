// tslint:disable: no-console

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

out vec2 vTexCoord;

void main()
{
    vTexCoord = aTexCoord;
    gl_Position = aPosition;
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform sampler2D uSampler;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
    fragColor = texture(uSampler, vTexCoord);
}`;

const gl = document.querySelector('canvas').getContext('webgl2');

const program = gl.createProgram();

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
gl.useProgram(program);

const positionData = new Float32Array([
    // Quad 1
    -1,0,
    0,1,
    -1,1,
    -1,0,
    0,0,
    0,1,

    // Quad 2
    0,0,
    1,1,
    0,1,
    0,0,
    1,0,
    1,1,

    // Quad 3
    -1,-1,
    0,0,
    -1,0,
    -1,-1,
    0,-1,
    0,0,

    // Quad 4
    0,-1,
    1,0,
    0,0,
    0,-1,
    1,-1,
    1,0,
]);

const loadAtlas = () => new Promise(resolve => {
    const image = new Image();
    image.src = './assets/atlas.png';
    image.addEventListener('load', () => resolve(image));
});
const createUVLookup = async () => {
    const file = await fetch('./assets/atlas.json');
    const data = await file.json();

    const w = 128 / 1024;
    const h = 128 / 2048;
    const hPadding = .25 / 1024;
    const vPadding = .25 / 2048;

    return (name) => {
        if (!data[name]) return null;
        const [u,v] =  data[name];

        return [
            u + hPadding,                          v - vPadding + h,
            u - hPadding + w,                      v + vPadding,
            u + hPadding,                          v + vPadding,

            u + hPadding,                          v - vPadding + h,
            u - hPadding + w,                      v - vPadding + h,
            u - hPadding + w,                      v + vPadding,
        ];
    };
};

const main = async () => {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const texCoordData = new Float32Array(2 * 4 * 6);
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoordData.byteLength, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    const image = await loadAtlas();
    const getUVs = await createUVLookup();
    texCoordData.set(getUVs('medievalTile_04'), 0);
    texCoordData.set(getUVs('medievalTile_06'), 12);
    texCoordData.set(getUVs('medievalTile_58'), 24);
    texCoordData.set(getUVs('medievalTile_31'), 36);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, texCoordData);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 2048, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    gl.drawArrays(gl.TRIANGLES, 0, 24);
};

main();