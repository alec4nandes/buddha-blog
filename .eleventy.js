const { getPostData, highlightAll } = require("./src/misc.js");
const { getAllPosts } = require("./src/read-write.js");

module.exports = function (eleventyConfig) {
    fetchPostsAndTags().then(([allPosts, allTags]) => {
        eleventyConfig.addCollection("posts", function () {
            return allPosts;
        });
        eleventyConfig.addCollection("allTags", function () {
            return allTags;
        });
    });

    return {
        dir: {
            input: "views",
            output: "public",
        },
    };

    async function fetchPostsAndTags() {
        const allPosts = (await getAllPosts()).map(getData),
            allTags = [
                ...new Set(
                    allPosts
                        .map((entry) => entry.post.tags)
                        .flat()
                        .filter(Boolean)
                ),
            ];
        allTags.sort();
        return [allPosts, allTags];

        function getData(entry) {
            const { sutta } = entry;
            entry.post = {
                ...entry.post,
                ...getPostData(entry),
            };
            entry.sutta.display.highlighted = highlightAll(sutta);
            return entry;
        }
    }
};
