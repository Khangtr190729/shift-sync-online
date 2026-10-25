/**
 * Middleware kiểm thực dữ liệu đầu vào sử dụng Zod
 * Hỗ trợ kiểm tra đồng thời body, query, và params
 */
export const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      // 1. Kiểm tra Params nếu có schema
      if (schemas.params) {
        const parsedParams = await schemas.params.safeParseAsync(req.params);
        if (!parsedParams.success) {
          const firstIssue = parsedParams.error.issues[0];
          return res.status(400).json({
            success: false,
            message: firstIssue?.message || 'Tham số đường dẫn (params) không hợp lệ.',
            errors: parsedParams.error.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          });
        }
        try {
          req.params = parsedParams.data;
        } catch {
          Object.assign(req.params, parsedParams.data);
        }
      }

      // 2. Kiểm tra Query nếu có schema
      if (schemas.query) {
        const parsedQuery = await schemas.query.safeParseAsync(req.query);
        if (!parsedQuery.success) {
          const firstIssue = parsedQuery.error.issues[0];
          return res.status(400).json({
            success: false,
            message: firstIssue?.message || 'Tham số truy vấn (query) không hợp lệ.',
            errors: parsedQuery.error.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          });
        }
        try {
          req.query = parsedQuery.data;
        } catch {
          Object.defineProperty(req, 'query', {
            value: parsedQuery.data,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }

      // 3. Kiểm tra Body nếu có schema
      if (schemas.body) {
        const parsedBody = await schemas.body.safeParseAsync(req.body);
        if (!parsedBody.success) {
          const firstIssue = parsedBody.error.issues[0];
          return res.status(400).json({
            success: false,
            message: firstIssue?.message || 'Dữ liệu đầu vào (body) không hợp lệ.',
            errors: parsedBody.error.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          });
        }
        req.body = parsedBody.data;
      }

      return next();
    } catch (err) {
      console.error('Lỗi trong validateRequest middleware:', err);
      return res.status(500).json({
        success: false,
        message: `Lỗi kiểm tra dữ liệu: ${err.message}`,
      });
    }
  };
};

/**
 * Helper bọc nhanh cho việc chỉ validate body
 */
export const validateBody = (schema) => validateRequest({ body: schema });

/**
 * Helper bọc nhanh cho việc chỉ validate query
 */
export const validateQuery = (schema) => validateRequest({ query: schema });

/**
 * Helper bọc nhanh cho việc chỉ validate params
 */
export const validateParams = (schema) => validateRequest({ params: schema });
