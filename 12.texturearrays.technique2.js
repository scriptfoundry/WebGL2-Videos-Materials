// tslint:disable: no-console
const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;
layout(location=2) in float aDepth;

out vec2 vTexCoord;
out float vDepth;

void main()
{
    vDepth = aDepth;
    vTexCoord = aTexCoord;
    gl_Position = aPosition;
}`;

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform mediump sampler2DArray uSampler;

in vec2 vTexCoord;
in float vDepth;

out vec4 fragColor;

void main()
{
    fragColor = texture(uSampler, vec3(vTexCoord, vDepth));
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
    -1,-1,      0,1,
    1,1,        1,0,
    -1,1,       0,0,
    -1,-1,      0,1,
    1,-1,       1,1,
    1,1,        1,0,
]);

const loadImage = (name) => new Promise(resolve => {
    const image = new Image();
    image.src = `./assets/${name}.png`;
    image.addEventListener('load', () => resolve(image));
});

const createUVLookup = async () => {
    const file = await fetch('./atlas.json');
    const data = await file.json();

    const names = Object.keys(data);

    return (index) => names[index] ?? null;
};
const main = async () => {
    const getImageName = await createUVLookup();

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);

    // Step 1: allocate space on the GPU for 126 textures of 128x128px
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 8, gl.RGBA8, 128,128,126);

    // Step 2: loop through all your images
    for (let i = 0; i < 126; i++) {
        // Step 3: Get the HTMLImageElement object for this iteration
        const image = await loadImage(getImageName(i));

        // Step 4: Place that 128x128 image at its own depth
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0,0,0, i, 128,128,1, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // EXTRA CREDITS: You can combine this with Technique 1 and upload a
        // stack of textures at once. They will each go in their own depth at
        // a depth of `i + sliceNumber`
    }

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.vertexAttrib1f(2, 4); // Show the texture found at the depth of 4
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.generateMipmap(gl.TEXTURE_2D_ARRAY)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

main();