const functions = require("firebase-functions");

// Play with this to set up automated emailing for new posts:

const // func = functions.https.onRequest(app),
    onCreateDraft = functions.firestore
        .document("drafts/{draftId}")
        .onCreate(console.log("DO SOMETHING"));

module.exports = {
    // func,
    onCreateDraft,
};
