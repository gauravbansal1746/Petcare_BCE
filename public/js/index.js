// addAlert — shows a dismissible Bootstrap danger alert in the login modal
var API_BASE = window.REACT_APP_API_URL || "https://petcarebce-production.up.railway.app";
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function setFieldError(selector, message) {
    var $el = $(selector);
    $el.toggleClass("is-invalid", !!message);
    var id = selector.replace("#", "") + "-error";
    var $err = $("#" + id);
    if ($err.length === 0) {
        $el.after('<div id="' + id + '" class="text-danger small mt-1"></div>');
        $err = $("#" + id);
    }
    $err.text(message || "");
}

function validateEmailField(selector) {
    var v = ($(selector).val() || "").trim();
    if (!EMAIL_RE.test(v)) {
        setFieldError(selector, "Please enter a valid email (e.g., example@gmail.com)");
        return false;
    }
    setFieldError(selector, "");
    return true;
}

function validatePasswordField(selector) {
    var v = $(selector).val() || "";
    if (!PASSWORD_RE.test(v)) {
        setFieldError(selector, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
        return false;
    }
    setFieldError(selector, "");
    return true;
}

function addAlert(message) {
    $("#alerts").append(
        '<div class="alert alert-danger alert-dismissible fade show" role="alert">' + message +
        ' <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
        "</div>"
    );
}

$(document).ready(function () {

    // ── Check email availability on blur ─────────────────────────────────────
    $("#txtEmail").blur(function () {
        var custEmail = $("#txtEmail").val();
        if (!custEmail) return;
        if (!validateEmailField("#txtEmail")) return;

        $.ajax({
            type: "get",
            url:  API_BASE + "/api/v1/auth/check-email",
            data: { emailForServer: custEmail }
        }).done(function (resp) {
            $("#res").html(resp.available
                ? "<span style='color:green'>&#10003; Available</span>"
                : "<span style='color:red'>&#10007; Already taken</span>"
            );
        }).fail(function () {
            $("#res").html("");
        });
    });

    // ── Sign Up ───────────────────────────────────────────────────────────────
    $("#signup-btn").click(function () {
        var x = $("#txtEmail").val();
        var y = $("#txtPwd").val();
        var z = $("#signup-combo").val();

        if (!x || !y || z === "Select") {
            $("#res-signup-btn").html("<span style='color:red'>Please fill all fields.</span>");
            return;
        }
        var okEmail = validateEmailField("#txtEmail");
        var okPwd = validatePasswordField("#txtPwd");
        setFieldError("#signup-combo", z === "Select" ? "All required fields must be filled" : "");
        if (!okEmail || !okPwd || z === "Select") return;

        $.ajax({
            type:        "post",
            url:         API_BASE + "/api/v1/auth/signup",
            contentType: "application/json",
            data:        JSON.stringify({ emailForServer: x, pwdForServer: y, typeForServer: z })
        }).done(function (resp) {
            $("#res-signup-btn").html("<span style='color:green'>" + resp.message + "</span>");
        }).fail(function (xhr) {
            var msg = xhr.responseJSON ? xhr.responseJSON.message : "Signup failed.";
            $("#res-signup-btn").html("<span style='color:red'>" + msg + "</span>");
        });
    });

    // ── Login ─────────────────────────────────────────────────────────────────
    $("#login-btn").click(function () {
        var x = $("#txtEmail2").val();
        var y = $("#txtPwd2").val();

        if (!x || !y) {
            addAlert("Please enter email and password.");
            return;
        }
        var okEmail = validateEmailField("#txtEmail2");
        var okPwd = validatePasswordField("#txtPwd2");
        if (!okEmail || !okPwd) return;

        $.ajax({
            type:        "post",
            url:         API_BASE + "/api/v1/auth/login",
            contentType: "application/json",
            data:        JSON.stringify({ emailForServer: x, pwdForServer: y })
        }).done(function (resp) {
            localStorage.setItem("token", resp.token);
            localStorage.setItem("role",  resp.role);
            localStorage.setItem("email", x);
            console.log("[login] session stored for", x, "role=", resp.role);

            if (resp.role === "admin")          window.location.href = "/dash-admin";
            else if (resp.role === "caretaker") window.location.href = "/dash-caretaker";
            else                                window.location.href = "/dash-client";
        }).fail(function (xhr) {
            var msg = xhr.responseJSON ? xhr.responseJSON.message : "Invalid Email or Password.";
            addAlert(msg);
        });
    });

});
