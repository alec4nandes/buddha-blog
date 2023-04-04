import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import db from "./database.js";

async function getAllDrafts() {
    const querySnapshot = await getDocs(collection(db, "drafts")),
        result = [];
    querySnapshot.forEach((doc) => result.push(doc.id));
    return result;
}

async function getDraft(id) {
    const docRef = doc(db, "drafts", id),
        docSnap = await getDoc(docRef);
    return docSnap.exists() && docSnap.data();
}

async function addDraft(draft) {
    const { sutta_id } = draft.sutta,
        { title } = draft.post,
        id = `${sutta_id}: ${title}`;
    // Add a new document in collection "cities"
    await setDoc(doc(db, "drafts", id), draft);
    return id;
}

export { addDraft, getAllDrafts, getDraft };
