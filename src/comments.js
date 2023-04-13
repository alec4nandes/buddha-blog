const { addComment, getComments } = require("./read-write.js");

async function loadComments() {
    await loadCommentsHTML();
    // add submit handlers to comment forms
    document
        .querySelectorAll(".add-comment")
        .forEach((form) => (form.onsubmit = handleAddComment));

    async function loadCommentsHTML() {
        const commentsDisplay = document.querySelector("#comments"),
            postId = commentsDisplay.getAttribute("data-post-id"),
            comments = await getComments(postId);
        commentsDisplay.innerHTML =
            getFormHTML(-1, postId) +
            comments
                ?.filter((comment) => !+comment.parent_id)
                .map((comment, index) =>
                    getCommentHTML(comment, index, comments, postId)
                )
                .join("<hr/>");

        function getFormHTML(index, postId) {
            return `
                <form id="${
                    index + 1
                }" class="add-comment" data-post-id="${postId}">
                    <label>name: <input name="name"/></label>
                    <label>
                        comment: <textarea name="message"></textarea>
                    </label>
                    <button type="submit">add comment</button>
                </form>
            `;
        }

        function getCommentHTML(comment, index, comments, postId, level = 0) {
            const { name, message, date } = comment;
            return `
                <div class="comment" style="padding-left: ${level * 15}px">
                    <b>${name}:</b> ${message}
                    <small>${date.seconds}</small>
                    ${getFormHTML(index, postId)}
                    ${comments
                        .map(
                            (c, i) =>
                                i !== index &&
                                +c.parent_id === index + 1 &&
                                getCommentHTML(
                                    c,
                                    i,
                                    comments,
                                    postId,
                                    level + 1
                                )
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

module.exports = { loadComments };
