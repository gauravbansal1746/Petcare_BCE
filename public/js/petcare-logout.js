/**
 * Clears session storage used by the app and returns to the home page.
 * After logout, API calls without a token receive 401 from verifyToken.
 */
function petcareLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/";
}
