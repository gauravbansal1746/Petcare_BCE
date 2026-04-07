var EMAIL_WITH_DOMAIN_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var PASSWORD_STRONG_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
var PHONE_RE = /^\d{10}$/;
var PIN_RE = /^\d{6}$/;

function validateEmail(email) {
    return EMAIL_WITH_DOMAIN_RE.test(String(email || "").trim());
}

function validatePassword(password) {
    return PASSWORD_STRONG_RE.test(String(password || ""));
}

function validatePhone(phone) {
    return PHONE_RE.test(String(phone || "").trim());
}

function validatePin(pin) {
    return PIN_RE.test(String(pin || "").trim());
}

module.exports = {
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validatePhone: validatePhone,
    validatePin: validatePin,
    EMAIL_MESSAGE: "Please enter a valid email (e.g., example@gmail.com)",
    PASSWORD_MESSAGE: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    PHONE_MESSAGE: "Mobile number must be exactly 10 digits",
    PIN_MESSAGE: "PIN code must be exactly 6 digits",
    REQUIRED_MESSAGE: "All required fields must be filled"
};
