type PermissionDeniedStateProps = {
  compact?: boolean;
};

export function PermissionDeniedState({ compact }: PermissionDeniedStateProps) {
  return (
    <div className={compact ? 'permission-state permission-state--compact' : 'permission-state'}>
      <h2>Permission required</h2>
      <p>This action is not available for your current role.</p>
    </div>
  );
}
