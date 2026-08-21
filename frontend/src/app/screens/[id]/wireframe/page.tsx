"use client";

import { use } from "react";
import { ArtifactManagement } from "@/components/artifact/ArtifactManagement";

export default function WireframeManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArtifactManagement screenId={id} apiPath="/api/wireframes" targetType="wireframe" title="와이어프레임 관리" writePermission="wireframe.write" />;
}
