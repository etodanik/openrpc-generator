import * as changeCase from "change-case";
import { NunjucksOpenRPCVisitor, NunjucksOpenRPCVisitorOptions } from "../../NunjucksOpenRPCVisitor.ts";
import { RenderMap } from "../../RenderMap.ts";
import { ContentDescriptorObject, CustomTypeMap, IncludeMap, InfoObject, JSONSchemaObject, MethodObject } from "../../types.ts";

interface UnrealOpenRPCVisitorOptions extends NunjucksOpenRPCVisitorOptions {}

export class UnrealOpenRPCVisitor extends NunjucksOpenRPCVisitor {
  #includeMap: IncludeMap = new Map();
  #customTypeIncludeMap: IncludeMap = new Map();
  #apiTag?: string;
  #pluginName?: string;
  #pluginTitle?: string;
  #pluginVersion?: string;

  constructor(options: UnrealOpenRPCVisitorOptions) {
    super(options);
    this.nunjucksEnv.addFilter(
      "unrealParamClassAttributeType",
      (method: MethodObject, param: ContentDescriptorObject) => this.#getUnrealClassAttributeTypeForParam(method, param),
    );
    this.nunjucksEnv.addFilter(
      "unrealParamMethodArgumentType",
      (method: MethodObject, param: ContentDescriptorObject) => this.#getUnrealMethodArgumentTypeForParam(method, param),
    );
    this.nunjucksEnv.addFilter(
      "unrealPropClassAttributeType",
      (method: MethodObject, param: ContentDescriptorObject, propName: string, propSchema: JSONSchemaObject) =>
        this.#getUnrealClassAttributeTypeForProp(method, param, propName, propSchema),
    );
    this.nunjucksEnv.addFilter(
      "unrealPropMethodArgumentType",
      (method: MethodObject, param: ContentDescriptorObject, propName: string, propSchema: JSONSchemaObject) =>
        this.#getUnrealMethodArgumentTypeForProp(method, param, propName, propSchema),
    );
  }

  visitInfo(info: InfoObject) {
    this.#apiTag = `${changeCase.constantCase(info.title)}RPC_API`;
    this.#pluginName = `${changeCase.pascalCase(info.title)}Rpc`;
    this.#pluginTitle = `${changeCase.sentenceCase(info.title)}`;
    this.#pluginVersion = info.version;

    const infoRenderMap = new RenderMap();

    infoRenderMap.add(`${this.#pluginName}.uplugin`, this.render("plugin.njk", { ...this.getCommonContext() }));

    infoRenderMap.add(`Source/${this.#pluginName}/${this.#pluginName}.Build.cs`, this.render("build.njk", { ...this.getCommonContext() }));

    infoRenderMap.add(
      `Source/${this.#pluginName}/Private/${this.#pluginName}.cpp`,
      this.render("moduleCpp.njk", { ...this.getCommonContext() }),
    );

    infoRenderMap.add(
      `Source/${this.#pluginName}/Public/${this.#pluginName}.h`,
      this.render("moduleH.njk", { ...this.getCommonContext() }),
    );

    return infoRenderMap;
  }

  visitMethods(methods: MethodObject[]) {
    const includeMap: IncludeMap = new Map();
    const methodsRenderMap = new RenderMap();

    for (const method of methods) {
      includeMap.set(`${changeCase.pascalCase(method.name)}RequestArgs.h`, "local");
      includeMap.set(`${changeCase.pascalCase(method.name)}ResponseData.h`, "local");
    }

    methodsRenderMap.add(
      `Source/${this.#pluginName}/Public/${this.#pluginName}Client.h`,
      this.render("clientH.njk", {
        ...this.getCommonContext(),
        includeMap,
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
    const context = { ...this.getCommonContext(), includeMap: this.#includeMap, method };
    methodRenderMap.add(`${path}/${changeCase.pascalCase(method.name)}RequestArgs.h`, this.render("requestArgsH.njk", context));
    methodRenderMap.add(`${path}/${changeCase.pascalCase(method.name)}ResponseData.h`, this.render("responseDataH.njk", context));
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

    return this.#createTypeForParamIfNeeded(method, param);
  }

  getCommonContext() {
    return {
      apiTag: this.#apiTag,
      pluginName: this.#pluginName,
      pluginTitle: this.#pluginTitle,
      pluginVersion: this.#pluginVersion,
    };
  }

  #createTypeForParamIfNeeded(
    method: MethodObject,
    param: ContentDescriptorObject,
  ) {
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

    const path = `Source/${this.#pluginName}/Public`;

    switch (param.schema.type) {
      case "object": {
        const customTypeRenderMap = new RenderMap();
        let customTypeIncludeMap: IncludeMap = new Map();

        if (param.schema.properties) {
          for (const [key, value] of Object.entries(param.schema.properties)) {
            customTypeIncludeMap = new Map([
              ...customTypeIncludeMap,
              ...this.resolveImportFromPropType(
                param,
                // at the moment we will treat enums as simple strings
                value.type ? value.type : value.enum ? "enum" : null,
              ),
            ]);
          }
        }

        const context = { ...this.getCommonContext(), includeMap: customTypeIncludeMap, method, param };

        return customTypeRenderMap.add(
          `${path}/${this.#getMethodObjectParamFileName(method, param)}`,
          this.render("customTypeH.njk", context),
        );
      }
      default:
        break;
    }
  }

  #getUnrealMethodArgumentTypeForParam(
    method: MethodObject,
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
        return `${this.#getMethodObjectParamType(method, param)}&`;
        return "const TMap&";
      case "array":
        throw new Error("array not implemented");
        return "const TArray&";
      case "null":
        throw new Error("null not implemented");
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in param ${param.name}`,
        );
    }
  }

  #getUnrealClassAttributeTypeForParam(
    method: MethodObject,
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
        return this.#getMethodObjectParamType(method, param);
      case "array":
        throw new Error("array not implemented");
        return "TArray";
      case "null":
        throw new Error("null not implemented");
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in param ${param.name}`,
        );
    }
  }

  #getUnrealMethodArgumentTypeForProp(
    method: MethodObject,
    param: ContentDescriptorObject,
    propName: string,
    propSchema: JSONSchemaObject,
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

    if (propSchema.enum) {
      return "const FString&";
    }

    switch (propSchema.type) {
      case "string":
        return "const FString&";
      case "number":
      case "integer":
        return "const int";
      case "boolean":
        return "const bool";
      case "object":
      case "array":
      case "null":
      default:
        throw new Error(
          `type ${propSchema.type} not implemented for method ${method.name} param ${param.name} prop ${propName}`,
        );
    }
  }

  #getUnrealClassAttributeTypeForProp(
    method: MethodObject,
    param: ContentDescriptorObject,
    propName: string,
    propSchema: JSONSchemaObject,
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

    if (propSchema.enum) {
      return "FString";
    }

    switch (propSchema.type) {
      case "string":
        return "FString";
      case "number":
      case "integer":
        return "int";
      case "boolean":
        return "bool";
      case "object":
      case "array":
      case "null":
      default:
        throw new Error(
          `type ${propSchema.type} not implemented for method ${method.name} param ${param.name} prop ${propName}`,
        );
    }
  }

  resolveImportFromPropType(
    param: ContentDescriptorObject,
    propType: string,
  ): IncludeMap {
    const includeMap: IncludeMap = new Map();
    switch (propType) {
      case "string":
      case "enum":
        includeMap.set("Containers/UnrealString.h", "local");
        break;
      case "number":
      case "integer":
      case "boolean":
        includeMap.set("CoreMinimal.h", "local");
        break;
      case "object":
      case "array":
      case "null":
      default:
        throw new Error(
          `Unsupported type: ${propType} in param ${param.name}`,
        );
    }

    return includeMap;
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
        includeMap.set(
          `${this.#getMethodObjectParamFileName(method, param)}`,
          "local",
        );
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

  #getMethodObjectParamType(
    method: MethodObject,
    param: ContentDescriptorObject,
  ) {
    return `F${changeCase.pascalCase(method.name)}${changeCase.pascalCase(param.name)}Param`;
  }

  #getMethodObjectParamFileName(
    method: MethodObject,
    param: ContentDescriptorObject,
  ) {
    return `${changeCase.pascalCase(method.name)}${changeCase.pascalCase(param.name)}Param.h`;
  }
}
