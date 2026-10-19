import type { Metadata } from "next";
import { InterviewRoom } from "@/components/interview/interview-room";

export const metadata: Metadata = { title: "面試室" };

export default function InterviewPage() {
  return <InterviewRoom />;
}
