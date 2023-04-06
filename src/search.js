import { getAllPosts } from "./read-write.js";
import { getSearchParam, getPostPreviewHTML } from "./misc.js";

export default async function loadSearch() {
    const posts = await findPosts(),
        resultsElem = document.querySelector("#search-results");
    resultsElem.innerHTML = posts.map(getPostPreviewHTML).join("<hr/>");

    async function findPosts() {
        const allPosts = await getAllPosts(),
            searchTerm = getSearchParam("search").trim();
        return allPosts.filter((entry) => findPost(entry, searchTerm));

        function findPost(entry, searchTerm) {
            const { post, sutta } = entry,
                { title, subtitle, image_caption, content, tags } = post,
                fieldsToCheck = [title, subtitle, image_caption, content, tags];
            return (
                fieldsToCheck.find((field) =>
                    field.toUpperCase().includes(searchTerm.toUpperCase())
                ) ||
                sutta.lines.find((line) =>
                    line.toUpperCase().includes(searchTerm.toUpperCase())
                )
            );
        }
    }
}
