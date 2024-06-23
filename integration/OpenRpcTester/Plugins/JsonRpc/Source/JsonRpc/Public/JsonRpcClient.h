#pragma once

#include "CoreMinimal.h"
#include "UObject/PropertyOptional.h"
#include "ExtendedJsonObjectConverter.h"
#include "TransportInterface.h"
#include "JsonRpcClient.generated.h"

UCLASS(Blueprintable, BlueprintType)
class JSONRPC_API UJsonRpcClient : public UObject
{
	GENERATED_BODY()

public:
	UJsonRpcClient();

	UFUNCTION(BlueprintCallable, Category="RPC")
	void Initialize(TScriptInterface<ITransportInterface> InTransport);
	void SendRequest(const FString& MethodName, const TSharedPtr<FJsonObject>& ParamsObj,
	                 const TFunction<void(const TSharedPtr<FJsonValue>&)>& OnResponse);

	/**
	 * Send a request with a struct payload. This is needed primarily because currently Unreal exposes TOptional to UHT
	 * but does not integrate it into JSON utilities.
	 *
	 * We can get rid of this helper or massively simplify it once FJsonObjectConverter::UPropertyToJsonValue supports
	 * TOptional properties natively.
	 **/
	template <typename InStructType>
	void SendRequest(const FString& MethodName, const InStructType& InStruct,
	                 const TFunction<void(const TSharedPtr<FJsonValue>&)>& OnResponse)
	{
		FJsonObjectConverter::CustomExportCallback ExportCb;
		ExportCb = FJsonObjectConverter::CustomExportCallback::CreateLambda(
			[&ExportCb](FProperty* Property, const void* Value) -> TSharedPtr<FJsonValue>
			{
				FString PropertyName = Property->GetName();
				if (const FOptionalProperty* OptionalProperty = CastField<const FOptionalProperty>(Property))
				{
					if (!OptionalProperty->IsSet(Value))
					{
						return MakeShared<FJsonValueNull>();
					}

					const void* InnerValue = OptionalProperty->GetValuePointerForReadIfSet(Value);
					FProperty* InnerProperty = OptionalProperty->GetValueProperty();
					return FJsonObjectConverter::UPropertyToJsonValue(InnerProperty, InnerValue, 0, 0, &ExportCb);
				}

				return nullptr;
			}
		);

		TSharedPtr<FJsonObject> ConvertedStruct = FJsonObjectConverter::UStructToJsonObject(InStruct, 0, 0, &ExportCb);

		SendRequest(MethodName, ConvertedStruct, OnResponse);
	}

private:
	TScriptInterface<ITransportInterface> Transport;
	TArray<TSharedPtr<FJsonValue>> JsonObjectToPositionalArray(const TSharedPtr<FJsonObject>& ParamsObj);
};
