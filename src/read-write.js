import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import db from "./database.js";

async function getAllDrafts() {
    return await getAllHelper("drafts");
}

async function getAllPosts() {
    return await getAllHelper("posts");
}

async function getAllHelper(coll) {
    const querySnapshot = await getDocs(collection(db, coll)),
        result = [];
    querySnapshot.forEach((doc) => result.push({ ...doc.data(), id: doc.id }));
    return result;
}

async function getDraft(id) {
    const docRef = doc(db, "drafts", id),
        docSnap = await getDoc(docRef);
    return docSnap.exists() && docSnap.data();
}

async function addDraft(draft) {
    return await addHelper(draft, "drafts");
}

async function addPost(draft) {
    return await addHelper(draft, "posts");
}

async function addHelper(draft, coll) {
    const { title } = draft.post;
    if (title.trim()) {
        const { sutta_id } = draft.sutta,
            id = `${sutta_id}: ${title}`;
        await setDoc(doc(db, coll, id), draft);
        return id;
    } else {
        alert("Must have a title!");
    }
}

export { addDraft, addPost, getAllDrafts, getAllPosts, getDraft };
