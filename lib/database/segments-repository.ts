import { getDatabase } from './database';
import type { ActivitySegment, Confidence, SegmentActivityType } from '../types';

function rowToSegment(row: Record<string, unknown>): ActivitySegment {
  return {
    id: row.id as number,
    sessionId: row.session_id as string,
    segmentIndex: row.segment_index as number,
    activityType: row.activity_type as SegmentActivityType,
    confidence: (row.confidence as Confidence) ?? null,
    startTime: row.start_time as number,
    endTime: (row.end_time as number) ?? null,
    distance: row.distance as number,
  };
}

export async function insertActivitySegment(
  segment: Omit<ActivitySegment, 'id'>,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO activity_segments (session_id, segment_index, activity_type, confidence, start_time, end_time, distance)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      segment.sessionId,
      segment.segmentIndex,
      segment.activityType,
      segment.confidence,
      segment.startTime,
      segment.endTime,
      segment.distance,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateActivitySegment(
  id: number,
  fields: Partial<Pick<ActivitySegment, 'endTime' | 'distance' | 'activityType' | 'confidence'>>,
): Promise<void> {
  const db = await getDatabase();
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (fields.endTime !== undefined) {
    setClauses.push('end_time = ?');
    values.push(fields.endTime);
  }
  if (fields.distance !== undefined) {
    setClauses.push('distance = ?');
    values.push(fields.distance);
  }
  if (fields.activityType !== undefined) {
    setClauses.push('activity_type = ?');
    values.push(fields.activityType);
  }
  if (fields.confidence !== undefined) {
    setClauses.push('confidence = ?');
    values.push(fields.confidence);
  }

  if (setClauses.length === 0) return;
  values.push(id);

  await db.runAsync(
    `UPDATE activity_segments SET ${setClauses.join(', ')} WHERE id = ?`,
    values,
  );
}

export async function getSegments(
  sessionId: string,
): Promise<ActivitySegment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM activity_segments WHERE session_id = ? ORDER BY start_time ASC',
    [sessionId],
  );
  return rows.map(rowToSegment);
}

export async function getOpenSegment(
  sessionId: string,
): Promise<ActivitySegment | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM activity_segments WHERE session_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1',
    [sessionId],
  );
  return row ? rowToSegment(row) : null;
}
