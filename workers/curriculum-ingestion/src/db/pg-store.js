/**
 * PostgreSQL production adapter stub.
 * Set DATABASE_URL=postgres://... to enable. SQLite remains default for local/dev.
 */
export function productionDatabaseStatus() {
  const url = process.env.DATABASE_URL || process.env.CURRICULUM_DATABASE_URL || "";
  if (!url) {
    return {
      status: "NOT_CONFIGURED",
      engine: "sqlite-dev-default",
      detail: "Set DATABASE_URL for PostgreSQL production",
    };
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    return {
      status: "INVALID",
      engine: "unknown",
      detail: "DATABASE_URL must be a postgres:// URL",
    };
  }
  return {
    status: "CONFIGURED",
    engine: "postgresql",
    detail: "Connection string present — migrate schema via workers/curriculum-ingestion migrate:pg",
  };
}
