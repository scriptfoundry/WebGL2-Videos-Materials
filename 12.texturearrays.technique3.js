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

const getImageData = (image) => {
    // Step 1: get the image width and height
    const { width, height } = image;

    // Step 2: create a canvas of the same size
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = width;
    tmpCanvas.height = height;

    // Step 3: get a 2D Rendering Context object (aka Context API context)
    const context = tmpCanvas.getContext('2d');

    // Step 4: upload your image to the GPU
    context.drawImage(image, 0,0);

    // Step 5: read the pixel data off the canvas and return it
    return context.getImageData(0,0, width, height).data;
};

const main = async () => {
    const image = await loadImage('atlas.full');

    // Step 1: extract the pixel data from the HTMLImageElement object
    const imageData = getImageData(image);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);

    // Step 2: allocate space on the GPU for your texture data
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 8, gl.RGBA8, 128,128,126);

    // Step 3: create a PBO
    const pbo = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, imageData, gl.STATIC_DRAW);

    // Step 4: assign a width and height to the PBO
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, image.width);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, image.height);

    // Step 5: Loop through each image in your atlas
    for (let i = 0; i < 126; i++) {
        //Step 6: figure out the origin point of the texture at that index
        const row = Math.floor(i / 8) * 128;
        const col = (i % 8) * 128;

        // Step 7: Assign that origin point to the PBO
        gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, col);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, row);

        // Step 8: Tell webgl to use the PBO and write that texture at its own depth
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0,0,0, i, 128,128,1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    }

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.vertexAttrib1f(2, 47); // Show the texture found at the depth of 47
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.generateMipmap(gl.TEXTURE_2D_ARRAY)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

main();