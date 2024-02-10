import { parseOpenRPCDocument } from "@open-rpc/schema-utils-js";
import { OpenRPCVisitor } from "./OpenRPCVisitor.ts";
import {
  ContentDescriptorObject,
  ContentDescriptorOrReference,
  InfoObject,
  isReferenceObject,
  MethodObject,
  OpenrpcDocument,
  Voidable,
} from "./types.ts";
import { RenderMap } from "./RenderMap.ts";

function ensureContentDescriptorIsResolved(
  contentDescriptorOrReference: ContentDescriptorOrReference,
): ContentDescriptorObject {
  if (isReferenceObject(contentDescriptorOrReference)) {
    throw new Error("Content descriptor is not dereferenced");
  }

  return contentDescriptorOrReference;
}

interface SchemaOptions {
  renderMap?: RenderMap;
  renderPath: string;
}

export class Schema {
  #inputSchema: object | unknown;
  #parsedSchema?: OpenrpcDocument;
  #info?: InfoObject;
  #methods: MethodObject[] = [];
  #renderMap: RenderMap = new RenderMap();
  #renderPath: string;

  constructor(schema: unknown, options: SchemaOptions) {
    this.#inputSchema = schema;
    this.#renderMap = options.renderMap ?? new RenderMap();
    this.#renderPath = options.renderPath;
  }

  async initialize() {
    // @ts-ignore: the typechecking here seems flimsy, but validation should provide enough type safety anyway
    this.#parsedSchema = await parseOpenRPCDocument(this.#inputSchema, {
      validate: true,
      dereference: true,
    });

    this.#info = this.#parsedSchema.info;

    for (const method of this.#parsedSchema.methods) {
      if (isReferenceObject(method)) {
        throw new Error("Method is not dereferenced");
      }

      this.#methods.push(method);
    }
  }

  accept(visitor: OpenRPCVisitor): void {
    if (!this.#parsedSchema) {
      throw new Error(
        "Schema not initialized. Please run initialize() before accepting visitors",
      );
    }

    if (!this.#info) {
      throw new Error(
        "Info is missing",
      );
    }

    this.#renderMap.clear();
    this.#mergeRenderMap(visitor.visitInfo(this.#info));

    for (const method of this.#methods) {
      for (const param of method.params) {
        this.#mergeRenderMap(
          visitor.visitMethodParam(
            method,
            ensureContentDescriptorIsResolved(param),
          ),
        );
      }

      this.#mergeRenderMap(visitor.visitMethod(method));
    }

    this.#mergeRenderMap(visitor.visitMethods(this.#methods));
    this.#renderMap.write(this.#renderPath);
  }

  #mergeRenderMap(renderMap?: Voidable<RenderMap>) {
    if (renderMap) {
      this.#renderMap.mergeWith(renderMap);
    }
  }
}
