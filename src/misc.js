function getSearchParam(param) {
    const params = new URL(document.location).searchParams;
    return params.get(param);
}

function loadSearchAndTagsHelper({ param, posts, displayElem, resultsElem }) {
    displayElem.innerText = param;
    resultsElem.innerHTML = posts.length
        ? posts.map(getPostPreviewHTML).join("<hr/>")
        : `<p id="nothing-found">No results found!</p>`;
}

function getPostPreviewHTML(post) {
    const { title, subtitle, dateString, imageHTML, content, tagsHTML, id } =
            getHTMLData(post),
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

function getSinglePostHTML(draft) {
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

function getHTMLData(aPost) {
    const { post, sutta, id } = aPost,
        { title, subtitle, date, image_url, image_caption, content, tags } =
            post,
        dateString = parseDate(date),
        tagsHTML = getTagsHTML(tags),
        imageHTML = getImageHTML(image_url, image_caption);
    return {
        title,
        subtitle,
        dateString,
        imageHTML,
        content,
        tagsHTML,
        id,
    };

    function getImageHTML(imageUrl, imageCaption) {
        return imageUrl
            ? `
                <figure>
                    <img src="${imageUrl}" />
                    ${
                        image_caption
                            ? `<figcaption>${imageCaption}</figcaption>`
                            : ""
                    }
                </figure>
            `
            : "";
    }

    function getTagsHTML(tags) {
        return `
            <p>tags: ${tags
                .split(",")
                .map((tag) => tag.trim())
                .map((tag) => `<a href="/tags.html/?tag=${tag}">${tag}</a>`)
                .join(", ")}</p>
        `;
    }
}

function parseDate(date) {
    const { seconds } = date,
        ms = seconds * 1000,
        d = new Date(ms),
        localeString = d.toLocaleDateString("en-us", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        }),
        hours = ("" + d.getHours()).padStart(2, "0"),
        minutes = d.getMinutes();
    return `${localeString} at ${hours}:${minutes}`;
}

function highlightAll(postSutta) {
    let { linesHTML } = postSutta.display,
        extraStart = 0;
    const { annotations } = postSutta.display,
        sorted = [...annotations].sort((a, b) => a.start - b.start);
    sorted.forEach((anno, i) => {
        let { start } = anno;
        start += extraStart;
        const { text, note } = anno,
            { spanOpenTag, spanCloseTag } = getNoteTags(
                annotations.indexOf(anno) + 1,
                note
            );
        extraStart += spanOpenTag.length + spanCloseTag.length;
        linesHTML = spliceLines({
            start,
            text,
            spanOpenTag,
            spanCloseTag,
            linesHTML,
        });
    });
    return linesHTML;
}

function getNoteTags(index, note) {
    const spanOpenTag = `<span id="a-${index}" class="highlighted">`,
        noteTag = note && `<small class="note-display"> ${note}</small>&nbsp;`,
        spanCloseTag = `${noteTag || ""}</span>`;
    return { spanOpenTag, spanCloseTag };
}

function spliceLines({ start, text, spanOpenTag, spanCloseTag, linesHTML }) {
    linesHTML = [...linesHTML];
    linesHTML.splice(
        start,
        text.length,
        `${spanOpenTag}${text}${spanCloseTag}`
    );
    return linesHTML.join("");
}

function addAnnotationJumpButtons(postSutta, isPublished) {
    const { annotations } = postSutta.display;
    // console.log(annotations);
    document.querySelector("#annotations").innerHTML =
        annotations
            .map((_, i) => `<button class="annotation-jump">${i + 1}</button>`)
            .join("") +
        (!isPublished && annotations.length > 1
            ? `<button id="show-all">show all</button>`
            : "");
    const deleteAnnotationForm = document.querySelector("#delete-annotation");
    if (deleteAnnotationForm) {
        if (annotations.length) {
            deleteAnnotationForm.querySelector("select").innerHTML = annotations
                .map((_, i) => `<option value="${i + 1}">${i + 1}</option>`)
                .join("");
            deleteAnnotationForm.onsubmit = (e) => {
                e.preventDefault();
                const index = e.target.index.value - 1;
                annotations.splice(index, 1);
                document.querySelector("#lines").innerHTML =
                    postSutta.display.linesHTML;
                addAnnotationJumpButtons(postSutta, isPublished);
            };
        }
        deleteAnnotationForm.style.display = annotations.length
            ? "flex"
            : "none";
    }
    addHandlers();

    function addHandlers() {
        const jumpButtons = document.querySelectorAll(".annotation-jump"),
            showAllButton = document.querySelector("#show-all");
        jumpButtons.forEach((b) => (b.onclick = handleAnnotationJump));
        showAllButton && (showAllButton.onclick = handleShowAll);

        function handleAnnotationJump(e) {
            const buttonText = e.target.innerText,
                getHighlight = () => document.querySelector(`#a-${buttonText}`);
            if (isPublished) {
                const allHighlights = [
                    ...document.querySelectorAll(".highlighted"),
                ];
                allHighlights.forEach((span) =>
                    span.classList.remove("expand")
                );
                getHighlight().classList.add("expand");
            } else {
                toggleAnnotationForm(false);
                lines.innerHTML = highlightAnnotation(buttonText, postSutta);
            }
            getHighlight().scrollIntoView({ behavior: "smooth" });
        }

        function handleShowAll() {
            toggleAnnotationForm(false);
            lines.innerHTML = highlightAll(postSutta);
            document
                // scroll to first annotation:
                .querySelector("#a-1")
                ?.scrollIntoView({ behavior: "smooth" });
        }
    }
}

function toggleAnnotationForm(enabled) {
    const clearButton = document.querySelector("#clear-to-annotate"),
        annotateButton = document
            .querySelector("#annotate")
            ?.querySelector("button[type='submit']");
    clearButton && (clearButton.disabled = enabled);
    annotateButton && (annotateButton.disabled = !enabled);
}

function highlightAnnotation(number, postSutta) {
    const { annotations } = postSutta.display,
        { start, text, note } = annotations[number - 1],
        { spanOpenTag, spanCloseTag } = getNoteTags(number, note);
    return spliceLines({
        start,
        text,
        spanOpenTag,
        spanCloseTag,
        linesHTML: postSutta.display.linesHTML,
    });
}

export {
    getSearchParam,
    loadSearchAndTagsHelper,
    getPostPreviewHTML,
    getSinglePostHTML,
    parseDate,
    highlightAll,
    addAnnotationJumpButtons,
    toggleAnnotationForm,
    highlightAnnotation,
};
