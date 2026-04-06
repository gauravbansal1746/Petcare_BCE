/**
 * API smoke tests — run with server already up: npm run test:api
 * Uses Node 18+ fetch. Set BASE_URL=http://127.0.0.1:3000 if needed.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

var base = process.env.BASE_URL || "http://127.0.0.1:3000";

function log(ok, name, detail) {
    console.log(ok ? "OK  " : "FAIL", name, detail != null ? "— " + JSON.stringify(detail) : "");
}

async function req(method, path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var init = { method: method, headers: headers };
    if (opts.body != null) init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    var r = await fetch(base + path, init);
    var text = await r.text();
    var json;
    try {
        json = text ? JSON.parse(text) : null;
    } catch (e) {
        json = { _raw: text };
    }
    return { status: r.status, json: json };
}

async function main() {
    console.log("BASE_URL=", base);

    var a = await req("GET", "/api/v1/caretakers/cities");
    log(a.status === 200 && a.json && a.json.status === "success" && Array.isArray(a.json.data), "GET /caretakers/cities", {
        status: a.status,
        count: a.json && a.json.data ? a.json.data.length : null
    });

    var b = await req("GET", "/api/v1/caretakers");
    log(b.status === 400, "GET /caretakers (no query → 400)", b.status);

    var c = await req("POST", "/api/v1/auth/login", {
        body: { emailForServer: "nonexistent-user@example.com", pwdForServer: "wrongpass12" }
    });
    log(c.status === 401, "POST /auth/login unknown user → 401", c.status);

    var d = await req("GET", "/api/v1/admin/users?page=1&limit=1");
    log(d.status === 401, "GET /admin/users no token → 401", d.status);

    var e = await req("GET", "/api/v1/bookings/my?page=1&limit=1");
    log(e.status === 401, "GET /bookings/my no token → 401", e.status);

    var f = await req("GET", "/api/v1/clients/profile?emailforServer=x@test.com");
    log(f.status === 401, "GET /clients/profile no token → 401", f.status);

    console.log("\nDone. If any FAIL, fix server or test data.");
}

main().catch(function (err) {
    console.error("Smoke test error (is the server running?)", err.message);
    process.exit(1);
});
