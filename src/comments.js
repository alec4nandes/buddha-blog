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
            comments = (await getComments(postId)) || [],
            isTopLevelComment = (comment) => comment.parent_id === -1,
            topLevelComments = comments.filter(isTopLevelComment),
            getCommentIndex = (comment, comments) => comments.indexOf(comment);
        commentsDisplay.innerHTML =
            "<h2>Leave a comment</h2>" +
            getFormHTML(postId, comments) +
            topLevelComments
                .map((comment, index) =>
                    getCommentHTMLRecursive(comment, index, comments, postId)
                )
                .join("");

        function getFormHTML(postId, comments, comment) {
            const commentIndex = getCommentIndex(comment, comments);
            return `
                <form id="${commentIndex}" class="add-comment" data-post-id="${postId}">
                    <label>name: <input name="name"/></label>
                    <label>
                        comment: <textarea name="message"></textarea>
                    </label>
                    <button type="submit">add comment</button>
                </form>
            `;
        }

        function getCommentHTMLRecursive(comment, index, comments, postId) {
            const { name, message, date } = comment,
                commentIndex = getCommentIndex(comment, comments);
            return `
                <div id="comment-${commentIndex}" class="comment">
                    <small class="date">${parseDate(date)}</small>
                    <br/>
                    <b>${name}:</b> ${message}
                    <details>
                        <summary><img src="/assets/add-comment.png" /></summary>
                        ${getFormHTML(postId, comments, comment)}
                    </details>
                    ${comments
                        .map(
                            (c, i) =>
                                i !== index &&
                                c.parent_id === commentIndex &&
                                getCommentHTMLRecursive(c, i, comments, postId)
                        )
                        .filter(Boolean)
                        .join("")}
                </div>
            `;
        }

        function parseDate(date) {
            const { seconds } = date,
                ms = seconds * 1000,
                d = new Date(ms),
                monthDay = d.toLocaleDateString("en-us", {
                    month: "short",
                    day: "numeric",
                }),
                year = ("" + d.getFullYear()).slice(2),
                pad = (num) => ("" + num).padStart(2, "0"),
                hours = pad(d.getHours()),
                minutes = pad(d.getMinutes());
            return `${monthDay} '${year} @ ${hours}:${minutes}`;
        }
    }

    async function handleAddComment(e) {
        e.preventDefault();
        const post_id = e.target.getAttribute("data-post-id"),
            parent_id = +e.target.id,
            name = e.target.name.value,
            message = e.target.message.value,
            index = await addComment({ post_id, parent_id, name, message });
        if (index !== undefined) {
            await loadComments();
            const postElem = document.querySelector("#post"),
                comment = document.querySelector(`#comment-${index}`),
                top =
                    comment?.offsetTop -
                    document.querySelector("header").offsetHeight;
            console.log(index, comment?.offsetTop, comment);
            postElem.scrollTo({
                top,
                behavior: "smooth",
            });
        }
    }
}

module.exports = { loadComments };
