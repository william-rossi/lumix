import { agencies } from "@/data/seed";
import { NewDevelopmentForm } from "@/components/dashboard/new-development-form";

export default function NewDevelopmentPage() {
  return <NewDevelopmentForm agency={agencies[0]} />;
}
