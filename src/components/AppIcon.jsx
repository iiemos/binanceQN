import { Icon } from '@iconify/react';

export default function AppIcon({ icon, className, ...props }) {
  return <Icon icon={icon} className={className} aria-hidden="true" {...props} />;
}
