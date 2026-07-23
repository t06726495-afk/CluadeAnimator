import { TeamForm } from "@/components/teams/TeamForm";
import { Card, CardBody } from "@/components/ui/Card";

export default function NewTeamPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Create a Team</h1>
      <Card>
        <CardBody className="pt-5">
          <TeamForm />
        </CardBody>
      </Card>
    </div>
  );
}
