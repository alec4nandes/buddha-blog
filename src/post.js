import { getPost } from "./read-write.js";
import {
    getSearchParam,
    getHTMLData,
    highlightAll,
    addAnnotationJumpButtons,
} from "./misc.js";

export default async function loadPost() {
    const id = getSearchParam("id"),
        draft = id && (await getPost(id));
    console.log(id);
    if (draft) {
        const { sutta } = draft,
            suttaSection = document.querySelector("section#sutta"),
            postSection = document.querySelector("section#post");
        suttaSection.innerHTML = highlightAll(sutta);
        postSection.innerHTML = getSinglePostHTML(draft);
        addAnnotationJumpButtons(sutta, true);
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
