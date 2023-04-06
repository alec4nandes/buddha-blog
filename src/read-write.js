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
    result.sort((a, b) => {
        const getDate = (x) => new Date(x.post.date.seconds * 1000);
        // most recent first:
        return getDate(b) - getDate(a);
    });
    return result;
}

async function getDraft(id) {
    return await getHelper(id, "drafts");
}

async function getPost(id) {
    return await getHelper(id, "posts");
}

async function getHelper(id, coll) {
    const docRef = doc(db, coll, id),
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

export { addDraft, addPost, getAllDrafts, getAllPosts, getDraft, getPost };
