import { redirect } from "next/navigation";

export default function RootPage() {
  // Pass right through to our newly grouped events deck route
  redirect("/event-types");
}