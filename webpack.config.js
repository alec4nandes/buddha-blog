const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        main: path.resolve(__dirname, "./src/pre-bundle.js"),
    },
    output: {
        path: path.resolve(__dirname, "./public"),
        filename: "bundle.js",
    },
};
