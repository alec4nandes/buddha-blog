import { getSearchParam, loadSearchAndTagsHelper } from "./misc.js";
import { getAllPosts } from "./read-write.js";

export default async function loadSearch() {
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
            return [...fieldsToCheck, ...sutta.lines].find((str) =>
                str.toUpperCase().includes(searchTerm.toUpperCase())
            );
        }
    }
}
