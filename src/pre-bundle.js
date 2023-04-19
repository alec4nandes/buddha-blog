const { loadSearch } = require("./search.js");
const { loadTags } = require("./tags.js");
const { loadAdmin } = require("./admin.js");
const { loadSignIn } = require("./sign-in.js");
const { loadComments } = require("./comments.js");

if (window.location.href.includes("/search")) {
    /*** SEARCH.HTML - FIND CONTENT ***/
    loadSearch();
} else if (window.location.href.includes("/tags")) {
    /*** TAGS.HTML - FIND RELATED CONTENT ***/
    loadTags();
} else if (window.location.href.includes("/admin")) {
    /*** ADMIN.HTML - EDIT POSTS ***/
    loadAdmin();
} else if (window.location.href.includes("/sign-in")) {
    /*** SIGN-IN.HTML - ACCESS DRAFTS ***/
    loadSignIn();
} else if (window.location.href.includes("/posts")) {
    loadComments();
}
