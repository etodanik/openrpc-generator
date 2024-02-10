import * as changeCase from "change-case";
import {
  NunjucksOpenRPCVisitor,
  NunjucksOpenRPCVisitorOptions,
} from "../../NunjucksOpenRPCVisitor.ts";
import { RenderMap } from "../../RenderMap.ts";
import {
  ContentDescriptorObject,
  IncludeMap,
  InfoObject,
  MethodObject,
} from "../../types.ts";

interface UnrealOpenRPCVisitorOptions extends NunjucksOpenRPCVisitorOptions {}

export class UnrealOpenRPCVisitor extends NunjucksOpenRPCVisitor {
  #includeMap: IncludeMap = new Map();
  #apiTag?: string;
  #pluginName?: string;
  #pluginTitle?: string;
  #pluginVersion?: string;

  constructor(options: UnrealOpenRPCVisitorOptions) {
    super(options);
    this.nunjucksEnv.addFilter(
      "unrealParamClassAttributeType",
      (param: ContentDescriptorObject) =>
        this.#getUnrealClassAttributeTypeForParam(param),
    );
    this.nunjucksEnv.addFilter(
      "unrealParamMethodArgumentType",
      (param: ContentDescriptorObject) =>
        this.#getUnrealMethodArgumentTypeForParam(param),
    );
  }

  visitInfo(info: InfoObject) {
    this.#apiTag = `${changeCase.constantCase(info.title)}RPC_API`;
    this.#pluginName = `${changeCase.pascalCase(info.title)}Rpc`;
    this.#pluginTitle = `${changeCase.sentenceCase(info.title)}`;
    this.#pluginVersion = info.version;

    const infoRenderMap = new RenderMap();

    infoRenderMap.add(
      `${this.#pluginName}.uplugin`,
      this.render("plugin.njk", {
        ...this.getCommonContext(),
      }),
    );

    infoRenderMap.add(
      `Source/${this.#pluginName}/${this.#pluginName}.Build.cs`,
      this.render("build.njk", {
        ...this.getCommonContext(),
      }),
    );

    infoRenderMap.add(
      `Source/${this.#pluginName}/Private/${this.#pluginName}.cpp`,
      this.render("moduleCpp.njk", {
        ...this.getCommonContext(),
      }),
    );

    infoRenderMap.add(
      `Source/${this.#pluginName}/Public/${this.#pluginName}.h`,
      this.render("moduleH.njk", {
        ...this.getCommonContext(),
      }),
    );

    return infoRenderMap;
  }

  visitMethods(methods: MethodObject[]) {
    const includeMap: IncludeMap = new Map();
    const methodsRenderMap = new RenderMap();

    for (const method of methods) {
      includeMap.set(
        `${changeCase.pascalCase(method.name)}RequestArgs.h`,
        "local",
      );
      includeMap.set(
        `${changeCase.pascalCase(method.name)}ResponseData.h`,
        "local",
      );
    }

    methodsRenderMap.add(
      `Source/${this.#pluginName}/Public/${this.#pluginName}Client.h`,
      this.render("clientH.njk", {
        ...this.getCommonContext(),
        methods,
      }),
    );
    methodsRenderMap.add(
      `Source/${this.#pluginName}/Private/${this.#pluginName}Client.cpp`,
      this.render("clientCpp.njk", {
        ...this.getCommonContext(),
        methods,
        includeMap,
      }),
    );
    return methodsRenderMap;
  }

  visitMethod(method: MethodObject) {
    const methodRenderMap = new RenderMap();
    const path = `Source/${this.#pluginName}/Public`;
    const context = {
      ...this.getCommonContext(),
      includeMap: this.#includeMap,
      method,
    };
    methodRenderMap.add(
      `${path}/${changeCase.pascalCase(method.name)}RequestArgs.h`,
      this.render("requestArgsH.njk", context),
    );
    methodRenderMap.add(
      `${path}/${changeCase.pascalCase(method.name)}ResponseData.h`,
      this.render("responseDataH.njk", context),
    );
    this.#includeMap.clear();
    return methodRenderMap;
  }

  visitMethodParam(method: MethodObject, param: ContentDescriptorObject) {
    this.#includeMap = new Map([
      ...this.#includeMap,
      ...this.resolveImportFromParamType(
        method,
        param,
      ),
    ]);
  }

  getCommonContext() {
    return {
      apiTag: this.#apiTag,
      pluginName: this.#pluginName,
      pluginTitle: this.#pluginTitle,
      pluginVersion: this.#pluginVersion,
    };
  }

  #getUnrealMethodArgumentTypeForParam(
    param: ContentDescriptorObject,
  ): string {
    if (typeof param.schema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in param ${param.name}`,
      );
    }

    if (typeof param.schema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in param ${param.name}`,
      );
    }

    switch (param.schema.type) {
      case "string":
        return "const FString&";
      case "number":
      case "integer":
        return "const int";
      case "boolean":
        return "const bool";
      case "object":
        throw new Error("Needs some work");
        return "const TMap&";
      case "array":
        throw new Error("Needs some work");
        return "const TArray&";
      case "null":
        throw new Error("Needs some work");
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in param ${param.name}`,
        );
    }
  }

  #getUnrealClassAttributeTypeForParam(
    param: ContentDescriptorObject,
  ): string {
    if (typeof param.schema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in param ${param.name}`,
      );
    }

    if (typeof param.schema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in param ${param.name}`,
      );
    }

    switch (param.schema.type) {
      case "string":
        return "FString";
      case "number":
      case "integer":
        return "int";
      case "boolean":
        return "bool";
      case "object":
        throw new Error("Needs some work");
        return "TMap";
      case "array":
        throw new Error("Needs some work");
        return "TArray";
      case "null":
        throw new Error("Needs some work");
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in param ${param.name}`,
        );
    }
  }

  resolveImportFromParamType(
    method: MethodObject,
    param: ContentDescriptorObject,
  ): IncludeMap {
    if (typeof param.schema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in method ${method.name} param ${param.name}`,
      );
    }

    if (typeof param.schema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in method ${method.name} param ${param.name}`,
      );
    }

    const includeMap: IncludeMap = new Map();

    switch (param.schema.type) {
      case "string":
        includeMap.set("Containers/UnrealString.h", "local");
        break;
      case "number":
      case "integer":
      case "boolean":
        includeMap.set("CoreMinimal.h", "local");
        break;
      case "object":
        includeMap.set("Containers/Map.h", "local");
        break;
      case "array":
        includeMap.set("Containers/Array.h", "local");
        break;
      case "null":
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in method ${method.name} param ${param.name}`,
        );
    }

    return includeMap;
  }
}
