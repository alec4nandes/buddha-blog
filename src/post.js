import { getPost } from "./read-write.js";
import { getSearchParam, getHTMLData } from "./misc.js";

export default async function loadPost() {
    const id = getSearchParam("id"),
        draft = id && (await getPost(id));
    console.log(id);
    if (draft) {
        const { sutta, post } = draft,
            suttaSection = document.querySelector("section#sutta"),
            postSection = document.querySelector("section#post");
        suttaSection.innerHTML = sutta.display.linesHTML;
        postSection.innerHTML = getSinglePostHTML(draft);
    }

    function getSinglePostHTML() {
        const { title, subtitle, dateString, imageHTML, content, tagsHTML } =
            getHTMLData(draft);
        return `
            <h1>${title}</h1>
            <h2>${subtitle}</h2>
            <p class="date">${dateString}</p>
            ${tagsHTML}
            <hr/>
            ${imageHTML}
            ${content}
        `;
    }
}
