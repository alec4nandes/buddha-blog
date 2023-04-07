import {
    addAnnotationJumpButtons,
    getSearchParam,
    getSinglePostHTML,
    getSuttaInfoHTML,
    highlightAll,
} from "./misc.js";
import { getPost } from "./read-write.js";

export default async function loadPost() {
    const id = getSearchParam("id"),
        draft = id && (await getPost(id));
    if (draft) {
        const { sutta } = draft,
            suttaInfoElem = document.querySelector("#sutta-info"),
            linesElem = document.querySelector("#lines"),
            postSection = document.querySelector("section#post");
        suttaInfoElem.innerHTML = getSuttaInfoHTML(sutta);
        linesElem.innerHTML = highlightAll(sutta);
        postSection.innerHTML = getSinglePostHTML(draft);
        addAnnotationJumpButtons(sutta, true);
    } else {
        window.location.href = "/404.html";
    }
}
