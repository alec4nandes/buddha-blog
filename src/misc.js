function addAnnotationJumpButtons(sutta, isPublished) {
    const { annotations } = sutta.display;
    if (annotations.length) {
        const annoElem = document.querySelector("#annotations"),
            getButtonHTML = (i) =>
                `<button class="annotation-jump">${i + 1}</button>`,
            showAllButton =
                !isPublished &&
                annotations.length > 1 &&
                `<button id="show-all">show all</button>`,
            deleteAnnotationForm = document.querySelector("#delete-annotation");
        annoElem.innerHTML =
            annotations.map((_, i) => getButtonHTML(i)).join("") +
            (showAllButton || "");
        if (deleteAnnotationForm) {
            const select = deleteAnnotationForm.querySelector("select"),
                getOptionHTML = (i) =>
                    `<option value="${i + 1}">${i + 1}</option>`;
            select.innerHTML = annotations
                .map((_, i) => getOptionHTML(i))
                .join("");
            deleteAnnotationForm.onsubmit = (e) =>
                handleDeleteAnnotation(e, annotations, sutta, isPublished);
        }
    }
    const container = document.querySelector("#notes-container");
    container.style.display = annotations.length ? "flex" : "none";
    addHandlers(sutta, isPublished);

    function handleDeleteAnnotation(e, annotations, sutta, isPublished) {
        e.preventDefault();
        const buttonText = e.target.index.value,
            index = buttonText - 1,
            goAhead = confirm(`Delete note #${buttonText}?`);
        if (goAhead) {
            annotations.splice(index, 1);
            document.querySelector("#lines").innerHTML =
                sutta.display.linesHTML;
            addAnnotationJumpButtons(sutta, isPublished);
        }
    }

    function addHandlers(sutta, isPublished) {
        const jumpButtons = document.querySelectorAll(".annotation-jump"),
            showAllButton = document.querySelector("#show-all"),
            linesElem = document.querySelector("#lines");
        jumpButtons.forEach(
            (b) =>
                (b.onclick = (e) =>
                    handleAnnotationJump(e, isPublished, linesElem, sutta))
        );
        showAllButton &&
            (showAllButton.onclick = () => handleShowAll(linesElem, sutta));

        function handleAnnotationJump(e, isPublished, linesElem, sutta) {
            const index = e.target.innerText - 1,
                getHighlight = (index) => document.querySelector(`#a-${index}`);
            if (isPublished) {
                const elems = document.querySelectorAll(".highlighted"),
                    highlights = [...elems];
                highlights.forEach((span) => span.classList.remove("expand"));
                getHighlight(index).classList.add("expand");
            } else {
                toggleAnnotationForm(false);
                linesElem.innerHTML = highlightAnnotation(index, sutta);
            }
            getHighlight(index).scrollIntoView({ behavior: "smooth" });
        }

        function handleShowAll(linesElem, sutta) {
            toggleAnnotationForm(false);
            linesElem.innerHTML = highlightAll(sutta);
            document
                // scroll to first annotation:
                .querySelector("#a-0")
                ?.scrollIntoView({ behavior: "smooth" });
        }
    }
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

function getSearchParam(param) {
    const params = new URL(document.location).searchParams;
    return params.get(param);
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

function getSuttaInfoHTML(sutta) {
    const {
        sutta_title,
        section_pali,
        chapter_number,
        chapter_title,
        chapter_description,
        sutta_description,
        section_title,
        section_description,
    } = sutta;
    return `
        <div id="sutta-info">
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
            <h2>${sutta_title}</h2>
            <h3>
                (${section_pali}${chapter_number ? " " + chapter_number : ""})
            </h3>
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
        </div>
    `;
}

function highlightAll(sutta) {
    const { annotations } = sutta.display;
    let { linesHTML } = sutta.display,
        extraStart = 0;
    annotations.forEach((anno) => {
        let { start } = anno;
        start += extraStart;
        const { text, note } = anno,
            { spanOpenTag, spanCloseTag } = getNoteTags(
                annotations.indexOf(anno),
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

function highlightAnnotation(index, sutta) {
    const { annotations } = sutta.display,
        { start, text, note } = annotations[index],
        { spanOpenTag, spanCloseTag } = getNoteTags(index, note);
    return spliceLines({
        start,
        text,
        spanOpenTag,
        spanCloseTag,
        linesHTML: sutta.display.linesHTML,
    });
}

function loadSearchAndTagsHelper({ param, posts, displayElem, resultsElem }) {
    displayElem.innerText = param;
    resultsElem.innerHTML = posts.length
        ? posts.map(getPostPreviewHTML).join("<hr/>")
        : `<p id="nothing-found">No results found!</p>`;
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

function toggleAnnotationForm(enabled) {
    const clearButton = document.querySelector("#clear-to-annotate"),
        annotateButton = document
            .querySelector("#annotate")
            ?.querySelector("button[type='submit']");
    clearButton && (clearButton.disabled = enabled);
    annotateButton && (annotateButton.disabled = !enabled);
}

/*** NOT EXPORTED: ***/

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

export {
    addAnnotationJumpButtons,
    getPostPreviewHTML,
    getSearchParam,
    getSinglePostHTML,
    getSuttaInfoHTML,
    highlightAll,
    highlightAnnotation,
    loadSearchAndTagsHelper,
    parseDate,
    toggleAnnotationForm,
};
