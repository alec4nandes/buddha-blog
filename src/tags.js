const { getSearchParam, loadSearchAndTagsHelper } = require("./misc.js");
const { getAllPosts } = require("./read-write.js");

async function loadTags() {
    const allPosts = await getAllPosts(),
        param = getSearchParam("tag"),
        resultsElem = document.querySelector("#tag-results");
    if (param) {
        const posts = await findPosts(allPosts, param),
            displayElem = document.querySelector("#tag-display");
        loadSearchAndTagsHelper({
            param,
            posts,
            displayElem,
            resultsElem,
        });
    }

    async function findPosts(allPosts, tag) {
        return allPosts.filter((entry) => findTag(entry, tag));

        function findTag(entry, tag) {
            const tags = entry.post.tags;
            return tags.includes(tag.trim().toLowerCase());
        }
    }
}

module.exports = { loadTags };
