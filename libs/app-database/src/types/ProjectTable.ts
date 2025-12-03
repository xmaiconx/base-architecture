import { Generated, ColumnType } from 'kysely';
import { ProjectSettings } from '@fnd/domain';

export interface ProjectTable {
  id: Generated<string>;
  account_id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  status: string;
  project_type: string | null;
  pipeline_name: string | null;
  settings: ColumnType<ProjectSettings | null, string | null, string | null>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  last_used_at: Date | null;
}
