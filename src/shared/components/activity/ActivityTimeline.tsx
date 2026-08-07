export type ActivityTimelineItem = {
  id: string;
  actor: string;
  event: string;
  subject?: string;
  occurredAt: string;
};

type ActivityTimelineProps = {
  items: ActivityTimelineItem[];
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <ol className="activity-timeline">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.actor}</strong> {item.event} {item.subject ? <span>{item.subject}</span> : null}
          <time dateTime={item.occurredAt}>{item.occurredAt}</time>
        </li>
      ))}
    </ol>
  );
}
