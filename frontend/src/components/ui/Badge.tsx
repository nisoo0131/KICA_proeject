import type { Bucket } from "@/lib/labels";

const bucketClass: Record<Bucket, string> = {
  blue: "badge-blue",
  orange: "badge-orange",
  red: "badge-red",
  green: "badge-green",
  gray: "badge-gray",
};

export function Badge({ label, bucket }: { label: string; bucket: Bucket }) {
  return <span className={`badge ${bucketClass[bucket]}`}>{label}</span>;
}
