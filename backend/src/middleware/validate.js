export const validate =
  ({ body, params, query }) =>
  (req, res, next) => {
    try {
      // Validate Params if schema provided
      if (params) {
        const parsedParams = params.parse(req.params || {});
        Object.assign(req.params, parsedParams);
      }

      // Validate Query if schema provided
      if (query) {
        const parsedQuery = query.parse(req.query || {});
        // Clear old raw string values and assign coerced numbers/defaults
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, parsedQuery);
      }

      // Validate Body if schema provided
      if (body) {
        req.body = body.parse(req.body || {});
      }

      next();
    } catch (err) {
      // Zod v3+ uses err.issues (fallback to err.errors for compatibility)
      const issues = err.issues || err.errors;

      if (issues) {
        const errors = issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return res
          .status(400)
          .json({ error: "Validation failed", details: errors });
      }

      console.error("Validation Error:", err);
      return res.status(400).json({ error: "Invalid request data" });
    }
  };
