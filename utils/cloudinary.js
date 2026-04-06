var cloudinary = null;

function isEnabled() {
    return !!(
        process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );
}

function getClient() {
    if (cloudinary) return cloudinary;
    cloudinary = require("cloudinary").v2;
    if (!isEnabled()) return cloudinary;

    // cloudinary.v2 auto-reads CLOUDINARY_URL, but also supports explicit config
    if (!process.env.CLOUDINARY_URL) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }
    return cloudinary;
}

/**
 * Upload an express-fileupload file to Cloudinary.
 * Returns: { url, public_id }
 */
exports.uploadFile = function uploadFile(file, opts, cb) {
    opts = opts || {};
    if (!isEnabled()) return cb(new Error("Cloudinary is not configured."));
    if (!file) return cb(new Error("No file provided."));

    var cld = getClient();
    var folder = process.env.CLOUDINARY_FOLDER || "petcare";

    // express-fileupload provides a temp file path when using useTempFiles,
    // but we are not using that. Upload via data URI.
    var mime = file.mimetype || "application/octet-stream";
    var b64 = Buffer.from(file.data).toString("base64");
    var dataUri = "data:" + mime + ";base64," + b64;

    cld.uploader.upload(
        dataUri,
        {
            folder: folder + "/" + (opts.subfolder || "uploads"),
            resource_type: "image"
        },
        function (err, result) {
            if (err) return cb(err);
            cb(null, { url: result.secure_url || result.url, public_id: result.public_id });
        }
    );
};

exports.isEnabled = isEnabled;

