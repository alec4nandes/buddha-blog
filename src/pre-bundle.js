import { addDraft, getAllDrafts, getDraft } from "./read-write.js";
import handleFindSutta from "./find-sutta.js";

const findSutta = document.querySelector("#find-sutta");
findSutta.onsubmit = (e) => {
    e.preventDefault();
    const suttaId = e.target.sutta.value;
    handleFindSutta(suttaId);
};

const editPost = document.querySelector("#edit-post");
editPost.onsubmit = handleUpdateDraft;

async function handleUpdateDraft(e) {
    e.preventDefault();
    updateDraftHelper();
}

async function updateDraftHelper() {
    const post = Object.fromEntries(new FormData(editPost)),
        draft = { sutta: document.postSutta, post },
        id = await addDraft(draft);
    alert("Draft updated!");
    window.location.href = `/?id=${id}`;
}

loadDraft();

async function loadDraft() {
    const params = new URL(document.location).searchParams,
        idParam = params.get("id"),
        draft = idParam && (await getDraft(idParam)),
        id = idParam?.split(":")[0];
    if (draft) {
        await handleFindSutta(id, draft.sutta);
        Object.entries(draft.post).forEach(
            ([name, value]) => (editPost[name].defaultValue = value)
        );
    }
}

listDrafts();

async function listDrafts() {
    const draftIds = await getAllDrafts();
    document.querySelector("#drafts").innerHTML =
        "DRAFTS: " + draftIds.length
            ? draftIds.map((id) => `<a href="./?id=${id}">${id}</a>`).join(", ")
            : "n/a";
}

export { updateDraftHelper };
