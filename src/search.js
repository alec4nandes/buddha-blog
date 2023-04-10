const { getSearchParam, loadSearchAndTagsHelper } = require("./misc.js");
const { getAllPosts } = require("./read-write.js");

async function loadSearch() {
    const param = getSearchParam("search"),
        posts = await findPosts(param),
        displayElem = document.querySelector("#search-term"),
        resultsElem = document.querySelector("#search-results");
    loadSearchAndTagsHelper({ param, posts, displayElem, resultsElem });

    async function findPosts(searchTerm) {
        const allPosts = await getAllPosts();
        return allPosts.filter((entry) => findPost(entry, searchTerm));

        function findPost(entry, searchTerm) {
            const { post, sutta } = entry,
                { title, subtitle, image_caption, content, tags } = post,
                fieldsToCheck = [title, subtitle, image_caption, content, tags];
            return [...fieldsToCheck, ...sutta.lines].find((str) => {
                if (Array.isArray(str)) {
                    return str.find((tag) =>
                        tag.includes(searchTerm.toLowerCase())
                    );
                } else {
                    return str.toLowerCase().includes(searchTerm.toLowerCase());
                }
            });
        }
    }
}

module.exports = { loadSearch };
