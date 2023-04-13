const { loadSearch } = require("./search.js");
const { loadTags } = require("./tags.js");
const { loadAdmin } = require("./admin.js");
const { loadSignIn } = require("./sign-in.js");
import { addComment, getComments } from "./read-write.js";

if (window.location.href.includes("/search")) {
    /*** SEARCH.HTML - FIND CONTENT ***/
    loadSearch();
} else if (window.location.href.includes("/tags")) {
    /*** TAGS.HTML - FIND RELATED CONTENT ***/
    loadTags();
} else if (window.location.href.includes("/admin")) {
    /*** ADMIN.HTML - EDIT POSTS ***/
    loadAdmin();
} else if (window.location.href.includes("/sign-in")) {
    /*** SIGN-IN.HTML - ACCESS DRAFTS ***/
    loadSignIn();
} else if (window.location.href.includes("/posts")) {
    loadAllComments();

    async function loadAllComments() {
        await loadCommentsHTML();
        // add submit handlers to comment forms
        document
            .querySelectorAll(".add-comment")
            .forEach((form) => (form.onsubmit = handleAddComment));

        async function loadCommentsHTML() {
            const postedComments = document.querySelector("#posted-comments"),
                postId = postedComments.getAttribute("data-post-id"),
                comments = await getComments(postId);
            postedComments.innerHTML = comments
                .filter((comment) => !+comment.parent_id)
                .map((comment, index) =>
                    getCommentHTML(comment, index, comments)
                )
                .join("<hr/>");

            function getCommentHTML(comment, index, comments, level = 0) {
                const { name, message, date } = comment;
                return `
                <div class="comment" style="padding-left: ${level * 15}px">
                    <b>${name}:</b> ${message}
                    <small>${date.seconds}</small>
                    <form id="${
                        index + 1
                    }" class="add-comment" data-post-id="${postId}">
                        <label>name: <input name="name"/></label>
                        <label>
                            comment: <textarea name="message"></textarea>
                        </label>
                        <button type="submit">add comment</button>
                    </form>
                    ${comments
                        .map(
                            (c, i) =>
                                i !== index &&
                                +c.parent_id === index + 1 &&
                                getCommentHTML(c, i, comments, level + 1)
                        )
                        .filter(Boolean)
                        .join("<hr/>")}
                </div>
            `;
            }
        }

        async function handleAddComment(e) {
            e.preventDefault();
            const post_id = e.target.getAttribute("data-post-id"),
                parent_id = e.target.id,
                name = e.target.name.value,
                message = e.target.message.value;
            await addComment({ post_id, parent_id, name, message });
            window.location.reload();
        }
    }
}

// else {
//     window.location.href = "/404.html";
// }
