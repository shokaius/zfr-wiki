import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/layout";

export function NotFound() {
  return (
    <div>
      <PageHeader title="Not found" kicker="404" />
      <p className="text-muted">
        That page doesn't exist.{" "}
        <Link to="/" className="text-primary-strong">
          Back to the overview
        </Link>
        .
      </p>
    </div>
  );
}
