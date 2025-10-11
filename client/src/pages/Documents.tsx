import { DocumentUpload } from "@/components/DocumentUpload";

export default function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Documents</h1>
        <p className="text-muted-foreground">Manage files and attachments</p>
      </div>

      <DocumentUpload />
    </div>
  );
}
