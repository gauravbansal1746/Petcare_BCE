// addAlert — shows a dismissible Bootstrap danger alert in the login modal
var API_BASE = window.REACT_APP_API_URL || "https://petcarebce-production.up.railway.app";

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
