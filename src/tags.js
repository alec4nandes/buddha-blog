import { getSearchParam, loadSearchAndTagsHelper } from "./misc.js";
import { getAllPosts } from "./read-write.js";

export default async function loadTags() {
    const allPosts = await getAllPosts(),
        allTags = getAllTags(allPosts),
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
    resultsElem.innerHTML +=
        (param ? `<hr/>` : "") +
        `<p>all tags: ${allTags.map(getTagLink).join(", ")}</p>`;

    function getAllTags(allPosts) {
        return allPosts
            .map((entry) => entry.post.tags.split(","))
            .flat()
            .map((tag) => tag.trim())
            .sort();
    }

    async function findPosts(allPosts, tag) {
        return allPosts.filter((entry) => findTag(entry, tag));

        function findTag(entry, tag) {
            const tags = entry.post.tags.toUpperCase();
            return tags.includes(tag.toUpperCase());
        }
    }

    function getTagLink(tag) {
        return `<a href="/tags.html?tag=${tag}">${tag}</a>`;
    }
}
