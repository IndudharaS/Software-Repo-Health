"use client";

import { Card } from "@/components/ui/Card";
import { Check, X } from "lucide-react";
import { STATUS } from "@/lib/chart-colors";
import type { CommunityHealth } from "@/lib/types";

export function CommunityChecklist({
  community,
}: {
  community: CommunityHealth;
}) {
  const items = [
    { label: "README", present: community.hasReadme },
    { label: "License", present: community.hasLicense },
    { label: "Contributing guide", present: community.hasContributing },
    { label: "Code of conduct", present: community.hasCodeOfConduct },
    { label: "Issue template", present: community.hasIssueTemplate },
    { label: "PR template", present: community.hasPullRequestTemplate },
  ];

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-medium">Community health files</h3>
        {community.healthPercentage !== null && (
          <span className="text-xs text-muted">
            {community.healthPercentage}% complete
          </span>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            {item.present ? (
              <Check
                className="size-4 shrink-0"
                style={{ color: STATUS.good }}
              />
            ) : (
              <X
                className="size-4 shrink-0"
                style={{ color: STATUS.critical }}
              />
            )}
            <span className={item.present ? "" : "text-muted"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
