export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    profile?: string[];
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface FHIRPatient extends FHIRResource {
  resourceType: "Patient";
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    text: string;
    family?: string;
    given?: string[];
  }>;
  gender: "male" | "female" | "other" | "unknown";
  birthDate?: string;
}

export interface FHIRBundle extends FHIRResource {
  resourceType: "Bundle";
  type: "document" | "collection" | "transaction";
  entry: Array<{
    fullUrl: string;
    resource: FHIRResource;
  }>;
}
