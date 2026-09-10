/**
 * Resume Version Service
 *
 * Provides in-memory resume version management.
 * The service is intentionally independent of a database so that
 * the versioning rules can be tested and later integrated with
 * MongoDB/Mongoose or another persistence layer.
 */

class ResumeVersionService {
  constructor() {
    this.resumes = new Map();
  }

  /**
   * Create a new resume version for a student.
   */
  createVersion(studentId, data) {
    if (!studentId) {
      throw new Error("studentId is required");
    }

    if (!data || !data.name || !data.fileUrl) {
      throw new Error("name and fileUrl are required");
    }

    const versions = this.resumes.get(studentId) || [];

    const nextVersion =
      versions.length === 0
        ? 1
        : Math.max(...versions.map((resume) => resume.version)) + 1;

    const resume = {
      id: `${studentId}-${nextVersion}`,
      studentId,
      name: data.name.trim(),
      version: nextVersion,
      fileUrl: data.fileUrl,
      createdAt: new Date().toISOString(),
      isActive: versions.length === 0,
    };

    versions.push(resume);
    this.resumes.set(studentId, versions);

    return resume;
  }

  /**
   * Return all resume versions belonging to a student.
   */
  getVersions(studentId) {
    return [...(this.resumes.get(studentId) || [])];
  }

  /**
   * Return a specific resume version.
   */
  getVersion(studentId, versionId) {
    const versions = this.resumes.get(studentId) || [];

    return versions.find((resume) => resume.id === versionId) || null;
  }

  /**
   * Make one resume version active.
   */
  activateVersion(studentId, versionId) {
    const versions = this.resumes.get(studentId) || [];

    const target = versions.find((resume) => resume.id === versionId);

    if (!target) {
      throw new Error("Resume version not found");
    }

    versions.forEach((resume) => {
      resume.isActive = resume.id === versionId;
    });

    return target;
  }

  /**
   * Delete a resume version.
   *
   * The active version cannot be deleted because doing so could
   * leave the student without a current resume.
   */
  deleteVersion(studentId, versionId) {
    const versions = this.resumes.get(studentId) || [];

    const index = versions.findIndex((resume) => resume.id === versionId);

    if (index === -1) {
      throw new Error("Resume version not found");
    }

    if (versions[index].isActive) {
      throw new Error("Active resume version cannot be deleted");
    }

    const [deleted] = versions.splice(index, 1);
    this.resumes.set(studentId, versions);

    return deleted;
  }
}

module.exports = ResumeVersionService;
