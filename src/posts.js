import { getAllPosts } from "./read-write.js";
import { getHTMLData } from "./misc.js";

export default async function loadPosts() {
    const posts = await getAllPosts(),
        displayElem = document.querySelector("#posts");
    displayElem.innerHTML = posts
        .map((post) => getPostPreviewHTML(post))
        .join("<hr/>");

    function getPostPreviewHTML(aPost) {
        const {
                title,
                subtitle,
                dateString,
                imageHTML,
                content,
                tagsHTML,
                id,
            } = getHTMLData(aPost),
            openLinkTag = `<a href="/post.html/?id=${id}">`;
        return `
            <div>
                <h2>${openLinkTag}${title}</a></h2>
                ${subtitle ? `<h3>${subtitle}</h3>` : ""}
                <p class="date">${dateString}</p>
                ${imageHTML}
                ${content.slice(0, 500)}
                ${content.length > 500 ? "..." : ""}
                <p>${openLinkTag}read alongside sutta</a></p>
                ${tagsHTML}
            </div>
        `;
    }
}
