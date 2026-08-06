export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Return formatted error messages
    const errors = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return res
      .status(400)
      .json({ error: "Validation failed", details: errors });
  }

  // Replace req.body with sanitized and parsed data
  req.body = result.data;
  next();
};
