import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Download, Eye } from "lucide-react";

interface Document {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: string;
}

export function DocumentUpload() {
  const [documents] = useState<Document[]>([
    { id: "1", name: "Contract_Villa_Miami.pdf", size: "2.4 MB", uploadedAt: "2 hours ago", type: "pdf" },
    { id: "2", name: "Property_Photos.zip", size: "15.8 MB", uploadedAt: "1 day ago", type: "zip" },
    { id: "3", name: "Inspection_Report.docx", size: "1.2 MB", uploadedAt: "3 days ago", type: "docx" },
  ]);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Drop files to upload</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse from your computer
          </p>
          <Button onClick={() => console.log('Upload clicked')} data-testid="button-upload">
            Select Files
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold mb-4">Uploaded Documents</h3>
        {documents.map((doc) => (
          <Card key={doc.id} className="p-4" data-testid={`card-document-${doc.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded">
                  <File className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm" data-testid={`text-filename-${doc.id}`}>{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.size} • {doc.uploadedAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" data-testid={`button-view-${doc.id}`}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" data-testid={`button-download-${doc.id}`}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" data-testid={`button-delete-${doc.id}`}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
