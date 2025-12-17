/**
 * Request logging middleware
 * Logs incoming requests with timing information
 */

/**
 * Request logger middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware function
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${new Date().toISOString()}] ${logLevel} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
