import DemoReel from "@/components/demo-reel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Repo Referee — Demo Reel",
  robots: { index: false },
};

export default function DemoPage() {
  return <DemoReel />;
}
