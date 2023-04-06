import { getPost } from "./read-write.js";
import {
    getSearchParam,
    getSinglePostHTML,
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
}
