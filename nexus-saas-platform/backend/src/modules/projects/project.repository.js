
const Project = require("./project.model");

// ==========================================
// 1. Create a project
// ==========================================

const createProject = async (projectData) => {
  return Project.create(projectData);
};

// ==========================================
// 2. Find a project by ID and organization
// ==========================================

const findProjectById = async (projectId, organizationId) => {
  return Project.findOne({
    _id: projectId,
    organizationId
  })
    .populate("createdBy", "name email avatar")
    .populate("archivedBy", "name email");
};

// ==========================================
// 3. Find all projects of an organization
// ==========================================

const findProjectsByOrganization = async (
  organizationId,
  filters = {}
) => {
  const query = {
    organizationId
  };

  if (filters.status) {
    query.status = filters.status;
  } else if (!filters.includeArchived) {
    query.status = { $ne: "archived" };
  }

  return Project.find(query)
    .populate("createdBy", "name email avatar")
    .sort({ createdAt: -1 });
};

// ==========================================
// 4. Update a project
// ==========================================

const updateProject = async (
  projectId,
  organizationId,
  updateData
) => {
  return Project.findOneAndUpdate(
    {
      _id: projectId,
      organizationId,
      status: { $ne: "archived" }
    },
    {
      $set: updateData
    },
    {
      new: true,
      runValidators: true
    }
  )
    .populate("createdBy", "name email avatar");
};

// ==========================================
// 5. Archive a project
// ==========================================

const archiveProject = async (
  projectId,
  organizationId,
  archivedBy
) => {
  return Project.findOneAndUpdate(
    {
      _id: projectId,
      organizationId,
      status: { $ne: "archived" }
    },
    {
      $set: {
        status: "archived",
        archivedAt: new Date(),
        archivedBy
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createProject,
  findProjectById,
  findProjectsByOrganization,
  updateProject,
  archiveProject
};
