const { getSearchParam, loadSearchAndTagsHelper } = require("./misc.js");
const { getAllPosts } = require("./read-write.js");

async function loadTags() {
    const resultsElem = document.querySelector("#tag-results"),
        param = getSearchParam("tag");
    resultsElem.innerHTML = param ? "..." : "<p><b>Select a tag below:</b></p>";
    if (param) {
        const allPosts = await getAllPosts(),
            posts = await findPosts(allPosts, param),
            displayElem = document.querySelector("#tag-display"),
            newHR = document.createElement("hr"),
            allTagsElem = document.querySelector("#all-tags");
        loadSearchAndTagsHelper({
            param,
            posts,
            displayElem,
            resultsElem,
        });
        document.querySelector("#posts").insertBefore(newHR, allTagsElem);
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
