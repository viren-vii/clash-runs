import { randomUUID } from 'expo-crypto';
import { getDatabase } from './database';
import type { Session, SessionActivityType, SessionStatus } from '../types';

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    startTime: row.start_time as number,
    endTime: (row.end_time as number) ?? null,
    status: row.status as SessionStatus,
    totalDistance: row.total_distance as number,
    totalSteps: row.total_steps as number,
    elapsedTime: row.elapsed_time as number,
    activityType: row.activity_type as SessionActivityType,
    userWeight: (row.user_weight as number) ?? 70,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export async function createSession(
  activityType: SessionActivityType = 'run',
  userWeight: number = 70,
): Promise<Session> {
  const db = await getDatabase();
  const now = Date.now();
  const id = randomUUID();

  await db.runAsync(
    `INSERT INTO sessions (id, start_time, status, activity_type, user_weight, created_at, updated_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?)`,
    [id, now, activityType, userWeight, now, now],
  );

  return {
    id,
    startTime: now,
    endTime: null,
    status: 'active',
    totalDistance: 0,
    totalSteps: 0,
    elapsedTime: 0,
    activityType,
    userWeight,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSession(id: string): Promise<Session | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM sessions WHERE id = ?',
    [id],
  );
  return row ? rowToSession(row) : null;
}

export async function getActiveSession(): Promise<Session | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM sessions WHERE status IN ('active', 'paused') ORDER BY start_time DESC LIMIT 1",
  );
  return row ? rowToSession(row) : null;
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM sessions WHERE status = 'completed' ORDER BY start_time DESC",
  );
  return rows.map(rowToSession);
}

export async function updateSession(
  id: string,
  fields: Partial<
    Pick<
      Session,
      | 'endTime'
      | 'status'
      | 'totalDistance'
      | 'totalSteps'
      | 'elapsedTime'
      | 'activityType'
    >
  >,
): Promise<void> {
  const db = await getDatabase();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (fields.endTime !== undefined) {
    setClauses.push('end_time = ?');
    values.push(fields.endTime);
  }
  if (fields.status !== undefined) {
    setClauses.push('status = ?');
    values.push(fields.status);
  }
  if (fields.totalDistance !== undefined) {
    setClauses.push('total_distance = ?');
    values.push(fields.totalDistance);
  }
  if (fields.totalSteps !== undefined) {
    setClauses.push('total_steps = ?');
    values.push(fields.totalSteps);
  }
  if (fields.elapsedTime !== undefined) {
    setClauses.push('elapsed_time = ?');
    values.push(fields.elapsedTime);
  }
  if (fields.activityType !== undefined) {
    setClauses.push('activity_type = ?');
    values.push(fields.activityType);
  }

  setClauses.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  await db.runAsync(
    `UPDATE sessions SET ${setClauses.join(', ')} WHERE id = ?`,
    values,
  );
}

export async function completeSession(id: string): Promise<void> {
  await updateSession(id, { status: 'completed', endTime: Date.now() });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}
