import { ContentDescriptorObject, MethodObject, ReferenceObject } from "@open-rpc/meta-schema";

export type Voidable<T> = T | void;

export type {
  Components,
  ContentDescriptorObject,
  ContentDescriptorOrReference,
  ExternalDocumentationObject,
  InfoObject,
  JSONSchemaObject,
  MethodObject,
  Methods,
  Openrpc,
  OpenrpcDocument,
  ReferenceObject,
  ServerObject,
} from "@open-rpc/meta-schema";

export function isReferenceObject(
  object: MethodObject | ReferenceObject | ContentDescriptorObject,
): object is ReferenceObject {
  if (object && object.$ref) {
    return true;
  }

  return false;
}

export type IncludeType = "local" | "system";
export type IncludeMap = Map<string, IncludeType>;
export type ImportMap = Map<string, { defaultImports: Set<string>; namedImports: Set<string> }>;
export type CustomTypeMap = Map<string, string>;
