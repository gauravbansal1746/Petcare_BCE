/**
 * parsePagination(query)
 *
 * Parses ?page and ?limit from a request query string.
 * Returns safe, bounded integers ready to drop into SQL LIMIT / OFFSET.
 *
 * Defaults : page=1, limit=10
 * Max limit: 100  (prevents a caller from dumping the whole table)
 *
 * Usage in a controller:
 *   var pg     = parsePagination(req.query);
 *   var sql    = "SELECT ... LIMIT ? OFFSET ?";
 *   dbRef.query(sql, [pg.limit, pg.offset], callback);
 *
 * Response helper — attach this to every paginated response:
 *   pagination: pg.meta(totalCount)
 */
module.exports = function parsePagination(query) {
    var page  = Math.max(1, parseInt(query.page,  10) || 1);
    var limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    var offset = (page - 1) * limit;

    return {
        page:   page,
        limit:  limit,
        offset: offset,

        // Call with the total row count to build the pagination metadata block
        meta: function (total) {
            return {
                total:       total,
                page:        page,
                limit:       limit,
                totalPages:  Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            };
        }
    };
};
