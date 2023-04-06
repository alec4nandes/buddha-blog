import { getAllPosts } from "./read-write.js";
import { getSearchParam, getPostPreviewHTML } from "./misc.js";

export default async function loadSearch() {
    const searchTerm = getSearchParam("search").trim(),
        posts = await findPosts(searchTerm),
        termDisplay = document.querySelector("#search-term"),
        resultsElem = document.querySelector("#search-results");
    resultsElem.innerHTML = posts.length
        ? posts.map(getPostPreviewHTML).join("<hr/>")
        : `<p id="nothing-found">No results found!</p>`;
    termDisplay.innerText = searchTerm;

    async function findPosts(searchTerm) {
        const allPosts = await getAllPosts();
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
