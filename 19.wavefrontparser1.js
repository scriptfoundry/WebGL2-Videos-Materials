/**
 * Loads a text file (for loading the Wavefront OBJ file)
 * @param {string} filename
 * @returns {string} contents of text file
 */
const getFileContents = async (filename) => {
    const file = await fetch(filename);
    const body = await file.text();
    return body;
};

/**
 * Converts an array of string numbers to an array of floating point numbers
 * @param {string[]} strings array of strings containing numeric values
 * @returns {number[]}  a regular JS array of floating point numbers
 */
const stringsToNumbers = (strings) => {
    const numbers = [];
    for (const str of strings) {
        numbers.push(parseFloat(str));
    }
    return numbers;
};

/**
 * Parses a Wavefront OBJ, returning an array buffer
 * @param {string} fileContents the text contents of a Wavefront OBJ file
 * @returns {ArrayBuffer} the array buffer of a Float32Array
 */
const parseFile = (fileContents) => {
    const positions = [];
    const texCoords = [];
    const normals = [];

    const arrayBufferSource = [];

    const lines = fileContents.split('\n');
    for (const line of lines) {
        const [ command, ...values ] = line.split(' ', 4);

        if (command === 'v') {
            positions.push(stringsToNumbers(values));
        } else if (command === 'vt') {
            texCoords.push(stringsToNumbers(values));
        } else if (command === 'vn') {
            normals.push(stringsToNumbers(values));
        }

        else if (command === 'f') {
            for (const group of values) {
                const [ positionIndex, texCoordIndex, normalIndex ] = stringsToNumbers(group.split('/'));

                arrayBufferSource.push(...positions[positionIndex - 1]);
                arrayBufferSource.push(...normals[normalIndex - 1]);
                arrayBufferSource.push(...texCoords[texCoordIndex - 1]);
            }
        }
    }

    // Note: if you want to use JSON, the regular JS array, you can stop here.
    // arrayBufferSource contains all the numeric data you want. Use these numbers
    // in your JSON output.
    // e.g.:
    // return JSON.stringify({ vertices: arrayBufferSource });

    // Because we're writing a binary file, we return a Float32Array buffer containing the vertex data.
    return new Float32Array(arrayBufferSource).buffer;
};

/**
 * Saves a binary file of the contents of arrayBuffer to the browser's Downloads folder
 * @param {string} fileName name of file to be saved
 * @param {ArrayBuffer} arrayBuffer array buffer to be stored
 */
const saveBinaryFile = (fileName, arrayBuffer) => {
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    document.body.appendChild(anchor);

    anchor.type = 'application/octet-stream';
    anchor.download = fileName;
    anchor.href = url;

    anchor.click();
};

const main = async () => {
    // 1. Load the Wavefront OBJ file
    // If using Node, use `fs.readFile(path, callback)`
    const fileContents = await getFileContents('burger.obj');

    // 2. Parse the file and create an array buffer from its contents
    const arrayBuffer = parseFile(fileContents);

    // 3. Save the binary file
    // If using Node, use `fs.writeFile(path, arrayBuffer, "binary", callback)`
    saveBinaryFile('burger.bin', arrayBuffer);
};

main();