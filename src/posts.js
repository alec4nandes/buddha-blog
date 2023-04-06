import { getAllPosts } from "./read-write.js";
import { getPostPreviewHTML } from "./misc.js";

export default async function loadPosts() {
    const posts = await getAllPosts(),
        displayElem = document.querySelector("#posts");
    displayElem.innerHTML = posts
        .map((post) => getPostPreviewHTML(post))
        .join("<hr/>");
}
