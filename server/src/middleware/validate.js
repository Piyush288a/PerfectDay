export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      const parsedQuery = schemas.query.parse(req.query);
      req.validatedQuery = parsedQuery;
      try {
        req.query = parsedQuery;
      } catch {
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    next();
  } catch (error) {
    next(error);
  }
};
