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
    } else {
        window.location.href = "/404.html";
    }

    function getSuttaInfoHTML() {
        const {
            sutta_title,
            section_pali,
            chapter,
            chapter_title,
            chapter_description,
            sutta_description,
            section_title,
            section_description,
        } = sutta;
        return `
            <details>
                <summary>
                    ${[...new Set([section_pali, section_title])].join(": ")}
                </summary>
                <p>${section_description}</p>
                ${
                    chapter_title && chapter_description
                        ? `
                            <p><u>${chapter_title.trim()}</u>:</p>
                            <p>${chapter_description}</p>
                        `
                        : ""
                }
            </details>
            <h1>${sutta_title}</h1>
            <h2>(${section_pali}${chapter ? " " + chapter : ""})</h2>
            ${
                sutta_description
                    ? `
                        <details>
                            <summary>Summary</summary>
                            <p>${sutta_description}</p>
                        </details>
                    `
                    : ""
            }
        `;
    }
}
