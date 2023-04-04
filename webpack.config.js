import path, { dirname } from "path";
import { fileURLToPath } from "url";
// for __dirname in module:
const __dirname = dirname(fileURLToPath(import.meta.url));

const module = {
    mode: "development",
    entry: {
        main: path.resolve(__dirname, "./src/pre-bundle.js"),
    },
    output: {
        path: path.resolve(__dirname, "./public"),
        filename: "bundle.js",
    },
};

export default module;
