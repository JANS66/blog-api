export const validate =
  ({ body, params, query }) =>
  (req, res, next) => {
    try {
      // Initialize container for sanitized inputs
      req.valid = {};

      if (params) {
        req.valid.params = params.parse(req.params || {});
      }

      if (query) {
        req.valid.query = query.parse(req.query || {});
      }

      if (body) {
        req.valid.body = body.parse(req.body || {});
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
