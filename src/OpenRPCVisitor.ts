import { RenderMap } from "./RenderMap.ts";
import { Voidable } from "./types.ts";
import {
  Components,
  ContentDescriptorObject,
  ExternalDocumentationObject,
  InfoObject,
  MethodObject,
  Openrpc,
  ServerObject,
} from "./types.ts";

export abstract class OpenRPCVisitor {
  visitOpenRPC(_openRPC: Openrpc): Voidable<RenderMap> {}
  visitInfo(_info: InfoObject): Voidable<RenderMap> {}
  visitExternalDocs(
    _externalDocs: ExternalDocumentationObject,
  ): Voidable<RenderMap> {}
  visitServers(_servers: ServerObject): Voidable<RenderMap> {}
  visitMethods(_methods: MethodObject[]): Voidable<RenderMap> {}
  visitMethod(_method: MethodObject): Voidable<RenderMap> {}
  visitMethodParam(
    _method: MethodObject,
    _param: ContentDescriptorObject,
  ): Voidable<RenderMap> {}
  visitMethodResult(
    _method: MethodObject,
    _result: ContentDescriptorObject,
  ): Voidable<RenderMap> {}
  visitMethodError(
    _method: MethodObject,
    _error: ContentDescriptorObject,
  ): Voidable<RenderMap> {}
  visitComponents(_type: Components): Voidable<RenderMap> {}
}
