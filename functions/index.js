// const functions = require("firebase-functions"),
//     exec = require("child_process").exec;

// const onCreateDraft = functions.firestore.document("drafts/{draftId}").onCreate(
//     // print directory to gcloud console.
//     // just snooping gcloud's file structure...
//     exec("ls -a", function (error, stdout, stderr) {
//         console.log("stdout: " + stdout);
//         console.log("stderr: " + stderr);
//         if (error !== null) {
//             console.log("exec error: " + error);
//         }
//     })
// );

// module.exports = {
//     onCreateDraft,
// };
