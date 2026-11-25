const auditLogService = require("./auditLog.service");

const getOrganizationAuditLogs = async (req, res) => {
  try {
    const result = await auditLogService.getOrganizationAuditLogs(
      req.auth.userId,
      req.params.organizationId,
      req.query.page || 1,
      req.query.limit || 20
    );

    return res.status(200).json({
      success: true,
      message: "Organization audit logs retrieved successfully",
      data: result.auditLogs,
      pagination: result.pagination
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode ? error.message : "Internal server error"
    });
  }
};

module.exports = {
  getOrganizationAuditLogs
};
