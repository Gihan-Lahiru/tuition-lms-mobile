# Database Migration Plan

1. Schema is managed exclusively through TypeORM migrations (`src/database/migrations/1731400000000-InitLmsSchema.ts`) with `synchronize: false`.
2. Backup database before deploying any migration in staging or production:
   - SQLite: copy `lms_tuition.db` to timestamped backup file.
   - MySQL: `mysqldump -u $DB_USER -p $DB_NAME > backup_pre_lms_$(date +%F).sql`.
3. Verify schema creation on staging (`DB_MIGRATIONS_RUN=true`) before switching production traffic.
4. Rollback steps: execute `queryRunner.down()` to cleanly drop new LMS tables (`attendance_*`, `exam_results`, `academic_terms`, `quiz_*`, etc.) or restore from pre-migration backup snapshot.

