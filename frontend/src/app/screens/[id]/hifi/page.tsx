"use client";

import { use } from "react";
import { ArtifactManagement } from "@/components/artifact/ArtifactManagement";

export default function HiFiManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArtifactManagement screenId={id} apiPath="/api/hifi-designs" targetType="hifi_design" title="Hi-Fi 디자인 관리" />;
}
