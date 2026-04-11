import { getDatabase } from './database';
import type { ActivitySegment, SegmentActivityType } from '../types';

function rowToSegment(row: Record<string, unknown>): ActivitySegment {
  return {
    id: row.id as number,
    sessionId: row.session_id as string,
    segmentIndex: row.segment_index as number,
    activityType: row.activity_type as SegmentActivityType,
    confidence: (row.confidence as string) ?? null,
    startTime: row.start_time as number,
    endTime: (row.end_time as number) ?? null,
    distance: row.distance as number,
  };
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

