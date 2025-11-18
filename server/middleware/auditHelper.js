/**
 * Helper middleware to extract audit information from request
 */
function getAuditInfo(req) {
  const user = req.user || null;
  const ipAddress = req.ip || req.connection?.remoteAddress || req.headers?.['x-forwarded-for']?.split(',')[0] || null;
  const userAgent = req.headers?.['user-agent'] || null;

  return {
    changedBy: user?.id || null,
    changedByEmail: user?.email || null,
    ipAddress,
    userAgent,
  };
}

module.exports = { getAuditInfo };

