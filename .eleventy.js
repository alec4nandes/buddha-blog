const { getPostData, highlightAll } = require("./src/misc.js");
const { getAllPosts } = require("./src/read-write.js");

module.exports = function (eleventyConfig) {
    setCollections();

    return {
        dir: {
            input: "views",
            output: "public",
        },
    };

    async function setCollections() {
        eleventyConfig.addCollection("posts", async function () {
            const allPosts = (await getAllPosts()).map(getData);
            return allPosts;

            function getData(entry) {
                const { sutta } = entry;
                entry.post = {
                    ...entry.post,
                    ...getPostData(entry),
                };
                entry.sutta.display.highlighted = highlightAll(sutta);
                return entry;
            }
        });
        eleventyConfig.addCollection("allTags", async function () {
            const allTags = (await getAllPosts())
                .map((entry) => entry.post.tags)
                .flat()
                .filter(Boolean);
            return allTags;
        });
    }
};
